import pandas as pd
import numpy as np

REQUIRED = [
    "Date", "Product", "Category",
    "Quantity", "Unit_Price", "Total_Amount",
    "Customer_ID", "Region"
]

def _br_to_float(series: pd.Series) -> pd.Series:
    """
    Converte strings no formato '1.234,56' → 1234.56.
    Mantém NaN caso o valor não seja parseável.
    """
    return (
        series.astype(str)
              .str.replace('.', '', regex=False)  
              .str.replace(',', '.', regex=False) 
              .astype(float)
    )

def load_csv_to_df(fh) -> pd.DataFrame:
    """Lê o CSV, valida colunas e normaliza tipos."""
    df = pd.read_csv(fh)

    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise ValueError(f"Colunas faltando: {missing}")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")

    df["Unit_Price"] = _br_to_float(df["Unit_Price"])
    df["Total_Amount"] = _br_to_float(df["Total_Amount"])

    mask = (df["Total_Amount"].isna()) | (df["Total_Amount"] == 0)
    df.loc[mask, "Total_Amount"] = df.loc[mask, "Quantity"] * df.loc[mask, "Unit_Price"]

    df["Month"] = df["Date"].dt.to_period("M").astype(str)

    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.fillna(0, inplace=True)

    return df

def calculate_metrics(df: pd.DataFrame) -> dict[str, any]:
    metrics = {
        "total_revenue": float(df["Total_Amount"].sum()),
        "orders": int(len(df)),
        "customers": int(df["Customer_ID"].nunique()),
        "avg_ticket": float(df["Total_Amount"].mean()) if len(df) else 0,

        "revenue_by_category": df.groupby("Category")["Total_Amount"].sum().to_dict(),
        "revenue_by_month": (
            df.groupby("Month")["Total_Amount"]
              .sum()
              .sort_index()
              .apply(float)
              .to_dict()
        ),
        "top_products": (
            df.groupby("Product")["Total_Amount"]
              .sum()
              .sort_values(ascending=False)
              .head(10)
              .apply(float)
              .to_dict()
        ),
    }
    return metrics
