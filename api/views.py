from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser
from api.services.sales_processing import load_csv_to_df, calculate_metrics, filter_df_by_date_range
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from datetime import date, timedelta

REQUIRED_COLS = [
    "Date", "Product", "Category",
    "Quantity", "Unit_Price", "Total_Amount",
    "Customer_ID", "Region"
]


@api_view(["GET"])
def health(_):
    return Response({"ok": True})

@extend_schema(
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {"file": {"type": "string", "format": "binary"}},
        }
    },
    parameters=[
        OpenApiParameter(
            name='period',
            description='Filtro de período pré-definido. Opções: "last_7_days", "this_month", "custom".',
            required=False,
            type=OpenApiTypes.STR,
            enum=['last_7_days', 'this_month', 'custom']
        ),
        OpenApiParameter(
            name='start_date',
            description='Data de início para período customizado (formato: YYYY-MM-DD)',
            required=False,
            type=OpenApiTypes.DATE
        ),
        OpenApiParameter(
            name='end_date',
            description='Data de fim para período customizado (formato: YYYY-MM-DD)',
            required=False,
            type=OpenApiTypes.DATE
        ),
    ],
    responses={200: ...} 
)
@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_sales(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "Arquivo ausente"}, status=400)

    # logica para filtro de data
    period = request.query_params.get("period")
    start_date_str = request.query_params.get("start_date")
    end_date_str = request.query_params.get("end_date")

    start_date, end_date = None, None
    today = date.today()

    try:
        if period == "last_7_days":
            start_date = today - timedelta(days=7)
            end_date = today
        elif period == "this_month":
            start_date = today.replace(day=1)
            end_date = today
        elif period == "custom" and start_date_str and end_date_str:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)

        df = load_csv_to_df(file)
        filtered_df = filter_df_by_date_range(df, start_date, end_date)
        metrics = calculate_metrics(filtered_df)
    except ValueError as exc:
        # Captura erros de conversão de data ou de colunas faltando
        return Response({"error": f"Erro nos dados de entrada: {exc}"}, status=400)
    except Exception:
        return Response({"error": "Falha interna ao processar o arquivo."}, status=500)

    return Response(
        {
            "start_date": start_date,
            "end_date": end_date,
            "records": filtered_df.to_dict(orient="records"),
            "metrics": metrics,
        }
    )
