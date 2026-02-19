"""Custom Decimal type that handles MongoDB Decimal128 deserialization."""

from decimal import Decimal
from typing import Annotated, Any

from pydantic import BeforeValidator


def _to_decimal(v: Any) -> Decimal:
    """Convert Decimal128 or any numeric value to Python Decimal."""
    if isinstance(v, Decimal):
        return v
    # bson.Decimal128 has a to_decimal() method
    if hasattr(v, "to_decimal"):
        return v.to_decimal()
    return Decimal(str(v))


DecimalField = Annotated[Decimal, BeforeValidator(_to_decimal)]
