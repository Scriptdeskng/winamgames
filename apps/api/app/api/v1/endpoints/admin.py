from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard")
def dashboard() -> dict[str, str]:
    return {"status": "placeholder"}

