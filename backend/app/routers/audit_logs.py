from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None, description="Filter by action name"),
    db: Session = Depends(get_db),
    current_auth = Depends(get_current_user)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    logs = query.order_by(desc(AuditLog.created_at)).limit(limit).all()
    return logs
