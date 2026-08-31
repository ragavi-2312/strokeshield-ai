from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class HospitalStaff(Base):
    __tablename__ = "hospital_staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="hospital_staff") # "hospital_staff", "triage_coordinator"
    phone = Column(String(50), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital = relationship("Hospital")
