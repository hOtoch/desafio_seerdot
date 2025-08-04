from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from api.services.sales_processing import load_csv_to_df, calculate_metrics
from drf_spectacular.utils import extend_schema

REQUIRED_COLS = [
    "Date", "Product", "Category",
    "Quantity", "Unit_Price", "Total_Amount",
    "Customer_ID", "Region"
]


@api_view(["GET"])
def health(_):
    return Response({"ok": True})

@extend_schema( # utilizaremos esse metadado para possibilitar o envio de um arquivo na requisição feita pelo swagger
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {"file": {"type": "string", "format": "binary"}},
        }
    },
    responses={200: ...} 
)

@api_view(["POST"])
@parser_classes([MultiPartParser]) # multipart/form-data
def upload_sales(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "Arquivo ausente"}, status=400)

    try:
        df = load_csv_to_df(file)
        metrics = calculate_metrics(df)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=400)
    except Exception:
        return Response({"error": "Falha ao ler CSV"}, status=400)

    return Response(
        {
            "records": df.to_dict(orient="records"),   # ou omitir se ficar pesado
            "metrics": metrics,
        }
    )
