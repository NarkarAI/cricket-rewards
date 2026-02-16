import httpx

COUNTRY_CURRENCY_MAP = {
    "US": "USD",
    "IN": "INR",
}

DEFAULT_COUNTRY = "US"
DEFAULT_CURRENCY = "USD"


async def detect_geo(ip_address: str) -> dict:
    """Detect country and currency from IP address."""
    if ip_address in ("127.0.0.1", "::1", "testclient"):
        return {
            "country_code": DEFAULT_COUNTRY,
            "currency": DEFAULT_CURRENCY,
            "detected_ip": ip_address,
        }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip_address}?fields=countryCode")
            if resp.status_code == 200:
                data = resp.json()
                country = data.get("countryCode", DEFAULT_COUNTRY)
                currency = COUNTRY_CURRENCY_MAP.get(country, DEFAULT_CURRENCY)
                return {
                    "country_code": country,
                    "currency": currency,
                    "detected_ip": ip_address,
                }
    except Exception:
        pass

    return {
        "country_code": DEFAULT_COUNTRY,
        "currency": DEFAULT_CURRENCY,
        "detected_ip": ip_address,
    }
