from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str = ""):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class InsufficientBalanceError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance",
            error_code="INSUFFICIENT_BALANCE",
        )


class FraudCheckFailedError(AppException):
    def __init__(self, flags: list[str]):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Transaction blocked by fraud check: {', '.join(flags)}",
            error_code="FRAUD_CHECK_FAILED",
        )


class OptimisticLockError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="Concurrent modification detected, please retry",
            error_code="OPTIMISTIC_LOCK",
        )


class DuplicateRewardError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate reward (idempotency key already used)",
            error_code="DUPLICATE_REWARD",
        )
