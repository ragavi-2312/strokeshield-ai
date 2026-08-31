from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional
from datetime import datetime

class AuditLogCreate(BaseModel):
    user_type: str
    user_name: str
    user_email: str
    action: str
    details: Optional[Dict[str, Any]] = None

class AuditLogResponse(BaseModel):
    id: int
    user_type: str
    user_name: str
    user_email: str
    action: str
    details: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
