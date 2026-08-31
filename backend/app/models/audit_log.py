from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_type = Column(String(50), nullable=False) # "Doctor", "Hospital Staff", "System"
    user_name = Column(String(150), nullable=False)
    user_email = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False) # e.g. "Doctor Login", "Face Screening Performed", "Referral Created"
    details = Column(JSON, default=dict) # e.g. {"patient_id": "P-1001", "result": "HIGH"}
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
