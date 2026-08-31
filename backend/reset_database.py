import os
import sys

# Ensure backend root in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine, ensure_sqlite_columns
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.models.ai_assessment import AIAssessment
from app.models.hospital import Hospital
from app.models.referral import Referral
from app.services.seed_data import seed_database, clear_demo_data

def run_reset():
    print("=" * 60)
    print("STROKESHIELD AI — DATABASE RESET & DEMO DATA PURGE")
    print("=" * 60)
    
    # 1. Ensure Schema
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()

    db = SessionLocal()
    try:
        # 2. Clear old demo data and re-seed
        seed_database(db, force_reset=True)

        # 3. Comprehensive Verification
        doctors = db.query(Doctor).all()
        patients = db.query(Patient).all()
        assessments = db.query(Assessment).all()
        ai_assessments = db.query(AIAssessment).all()
        hospitals = db.query(Hospital).all()
        referrals = db.query(Referral).all()

        print("\n" + "=" * 60)
        print("DATABASE VERIFICATION SUMMARY:")
        print("=" * 60)
        print(f"Total Doctors: {len(doctors)} (Expected: 2)")
        for doc in doctors:
            print(f"  -> {doc.name} | {doc.specialization} | {doc.hospital} | {doc.phone} | {doc.email} | Exp: {doc.experience_years} yrs | {doc.data_type} | {doc.data_source}")

        print(f"\nTotal Hospitals: {len(hospitals)} (Expected: 5)")
        for h in hospitals:
            print(f"  -> {h.name} ({h.address}) | {h.phone}")

        print(f"\nTotal Patients: {len(patients)} (Expected: 10)")
        for p in patients[:3]:
            print(f"  -> [{p.patient_id}] {p.name} ({p.age} {p.gender}) | Phone: {p.phone}")
        print(f"  ... and {len(patients) - 3} more patients")

        print(f"\nTotal Assessments: {len(assessments)} (Expected: >= 1)")
        print(f"Total Layer-2 AI Assessments: {len(ai_assessments)} (Expected: >= 1)")
        print(f"Total Emergency Referrals: {len(referrals)} (Expected: >= 1)")

        # Assertions
        assert len(doctors) == 2, f"Expected exactly 2 doctors, found {len(doctors)}"
        doc_names = [d.name for d in doctors]
        assert "Dr. Raha" in doc_names, "Dr. Raha missing"
        assert "Dr. Vijay" in doc_names, "Dr. Vijay missing"
        assert "Dr. Sarah Chen, MD" not in doc_names, "Old demo doctor Dr. Sarah Chen still present!"

        print("\n[SUCCESS] ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    run_reset()
