import re


def validate_pan(pan: str) -> bool:
    """Indian PAN: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)."""
    return bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan.upper()))


def validate_aadhaar_last4(digits: str) -> bool:
    return bool(re.match(r"^\d{4}$", digits))


def validate_ifsc(ifsc: str) -> bool:
    """IFSC: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)."""
    return bool(re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", ifsc.upper()))


def validate_ssn_last4(digits: str) -> bool:
    return bool(re.match(r"^\d{4}$", digits))


def validate_routing_number(routing: str) -> bool:
    """US ABA routing number: 9 digits with mod-10 checksum."""
    if not re.match(r"^\d{9}$", routing):
        return False
    d = [int(c) for c in routing]
    checksum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])
    return checksum % 10 == 0


def validate_postal_code(code: str, country: str) -> bool:
    if country == "IN":
        return bool(re.match(r"^\d{6}$", code))
    elif country == "US":
        return bool(re.match(r"^\d{5}(-\d{4})?$", code))
    return False


def validate_date_of_birth(dob: str) -> bool:
    """Basic YYYY-MM-DD format check."""
    return bool(re.match(r"^\d{4}-\d{2}-\d{2}$", dob))
