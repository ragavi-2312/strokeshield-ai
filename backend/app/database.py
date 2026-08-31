import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# For SQLite, check_same_thread needs to be False for FastAPI concurrent requests
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_sqlite_columns():
    """Lightweight SQLite schema migration ensuring new columns exist across tables."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    with engine.connect() as conn:
        try:
            # 1. Check doctors table
            res_doc = conn.execute(text("PRAGMA table_info(doctors)")).fetchall()
            existing_doc_cols = [row[1] for row in res_doc]
            
            if "role" not in existing_doc_cols and len(existing_doc_cols) > 0:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN role VARCHAR(50) DEFAULT 'DOCTOR'"))
            if "experience_years" not in existing_doc_cols and len(existing_doc_cols) > 0:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN experience_years INTEGER DEFAULT 6"))
            if "location" not in existing_doc_cols and len(existing_doc_cols) > 0:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN location VARCHAR(100) DEFAULT 'Chennai, Tamil Nadu'"))
            if "registration_number" not in existing_doc_cols and len(existing_doc_cols) > 0:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN registration_number VARCHAR(100) DEFAULT 'DEMO-REG'"))
            if "data_type" not in existing_doc_cols and len(existing_doc_cols) > 0:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN data_type VARCHAR(50) DEFAULT 'DEMO'"))
            if "data_source" not in existing_doc_cols and len(existing_doc_cols) > 0:
                conn.execute(text("ALTER TABLE doctors ADD COLUMN data_source VARCHAR(50) DEFAULT 'AI_GENERATED'"))

            # 2. Check patients table
            res_pat = conn.execute(text("PRAGMA table_info(patients)")).fetchall()
            existing_pat_cols = [row[1] for row in res_pat]
            if "data_type" not in existing_pat_cols and len(existing_pat_cols) > 0:
                conn.execute(text("ALTER TABLE patients ADD COLUMN data_type VARCHAR(50) DEFAULT 'DEMO'"))

            # 3. Check assessments table
            res_ass = conn.execute(text("PRAGMA table_info(assessments)")).fetchall()
            existing_ass_cols = [row[1] for row in res_ass]
            if "data_type" not in existing_ass_cols and len(existing_ass_cols) > 0:
                conn.execute(text("ALTER TABLE assessments ADD COLUMN data_type VARCHAR(50) DEFAULT 'DEMO'"))

            # 4. Check referrals table
            res_ref = conn.execute(text("PRAGMA table_info(referrals)")).fetchall()
            existing_ref_cols = [row[1] for row in res_ref]
            
            if "source_accuracy_meters" not in existing_ref_cols and len(existing_ref_cols) > 0:
                conn.execute(text("ALTER TABLE referrals ADD COLUMN source_accuracy_meters FLOAT"))
            if "source_timestamp" not in existing_ref_cols and len(existing_ref_cols) > 0:
                conn.execute(text("ALTER TABLE referrals ADD COLUMN source_timestamp DATETIME"))
            if "road_distance_km" not in existing_ref_cols and len(existing_ref_cols) > 0:
                conn.execute(text("ALTER TABLE referrals ADD COLUMN road_distance_km FLOAT"))
            if "data_type" not in existing_ref_cols and len(existing_ref_cols) > 0:
                conn.execute(text("ALTER TABLE referrals ADD COLUMN data_type VARCHAR(50) DEFAULT 'DEMO'"))

            # 5. Check hospitals table
            res_hosp = conn.execute(text("PRAGMA table_info(hospitals)")).fetchall()
            existing_hosp_cols = [row[1] for row in res_hosp]
            if "data_type" not in existing_hosp_cols and len(existing_hosp_cols) > 0:
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN data_type VARCHAR(50) DEFAULT 'DEMO'"))
                
            conn.commit()
        except Exception as e:
            print(f"Column migration notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
