from fastapi import APIRouter

from app.api.v1.endpoints.admin_draws import router as admin_draws_router
from app.api.v1.endpoints.admin_auth import router as admin_auth_router
from app.api.v1.endpoints.admin_data import router as admin_data_router
from app.api.v1.endpoints.admin_help import router as admin_help_router
from app.api.v1.endpoints.admin_kyc import router as admin_kyc_router
from app.api.v1.endpoints.admin_winners import router as admin_winners_router
from app.api.v1.endpoints.admin_payments import router as admin_payments_router
from app.api.v1.endpoints.admin_mutations import router as admin_mutations_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.banners import router as banners_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.intelli import router as intelli_router
from app.api.v1.endpoints.draws import router as draws_router
from app.api.v1.endpoints.content import router as content_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.kyc import router as kyc_router
from app.api.v1.endpoints.leaderboards import router as leaderboards_router
from app.api.v1.endpoints.missions import router as missions_router
from app.api.v1.endpoints.players import router as players_router
from app.api.v1.endpoints.sessions import router as sessions_router
from app.api.v1.endpoints.winners import router as winners_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(players_router, prefix="/players", tags=["players"])
api_router.include_router(sessions_router, prefix="/sessions", tags=["sessions"])
api_router.include_router(draws_router, prefix="/draws", tags=["draws"])
api_router.include_router(content_router, prefix="/content", tags=["content"])
api_router.include_router(missions_router, prefix="/missions", tags=["missions"])
api_router.include_router(leaderboards_router, prefix="/leaderboards", tags=["leaderboards"])
api_router.include_router(winners_router, prefix="/winners", tags=["winners"])
api_router.include_router(kyc_router, prefix="/kyc", tags=["kyc"])
api_router.include_router(intelli_router, prefix="/integrations/intelli", tags=["intelli"])
api_router.include_router(banners_router, prefix="/banners", tags=["banners"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_auth_router, prefix="/admin/auth", tags=["admin-auth"])
api_router.include_router(admin_data_router, prefix="/admin/data", tags=["admin-data"])
api_router.include_router(admin_help_router, prefix="/admin/data", tags=["admin-help"])
api_router.include_router(admin_mutations_router, prefix="/admin/mutations", tags=["admin-mutations"])
api_router.include_router(admin_draws_router, prefix="/admin/draws", tags=["admin-draws"])
api_router.include_router(admin_winners_router, prefix="/admin/winners", tags=["admin-winners"])
api_router.include_router(admin_kyc_router, prefix="/admin/kyc", tags=["admin-kyc"])
api_router.include_router(admin_payments_router, prefix="/admin/payments", tags=["admin-payments"])
