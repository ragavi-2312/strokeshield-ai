from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal, ensure_sqlite_columns
from app.models import Doctor, Patient, Assessment, Hospital, Referral, HospitalStaff, AuditLog
from app.services.seed_data import seed_database
from app.routers import (
    auth_router,
    patients_router,
    assessments_router,
    predict_router,
    hospitals_router,
    referrals_router,
    dashboard_router,
    audit_logs_router,
)

# Ensure tables and seed are always available
Base.metadata.create_all(bind=engine)
ensure_sqlite_columns()
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[{settings.APP_NAME}] Backend initialized successfully on {settings.API_PREFIX}")
    yield
    print(f"[{settings.APP_NAME}] Backend shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Assisted Stroke Early Triage & Emergency Referral Platform for Doctors and Receiving Hospitals.",
    lifespan=lifespan
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(patients_router, prefix=settings.API_PREFIX)
app.include_router(assessments_router, prefix=settings.API_PREFIX)
app.include_router(predict_router, prefix=settings.API_PREFIX)
app.include_router(hospitals_router, prefix=settings.API_PREFIX)
app.include_router(referrals_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(audit_logs_router, prefix=settings.API_PREFIX)

@app.get("/", response_class=HTMLResponse)
def root_index():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>StrokeShield AI API Backend</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 40px; max-width: 580px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
            .logo { width: 56px; height: 56px; background: linear-gradient(135deg, #0284c7, #0d9488); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
            h1 { font-size: 24px; font-weight: 900; margin: 0 0 8px 0; color: #ffffff; letter-spacing: -0.5px; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
            .btn-primary { display: block; background: #0284c7; color: white; text-decoration: none; padding: 14px 24px; border-radius: 14px; font-weight: 800; font-size: 15px; margin-bottom: 12px; transition: background 0.2s; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4); }
            .btn-primary:hover { background: #0369a1; }
            .btn-secondary { display: block; background: #334155; color: #e2e8f0; text-decoration: none; padding: 12px 20px; border-radius: 14px; font-weight: 700; font-size: 13px; transition: background 0.2s; }
            .btn-secondary:hover { background: #475569; }
            .badge { display: inline-block; background: rgba(13, 148, 136, 0.2); color: #2dd4bf; border: 1px solid rgba(45, 212, 191, 0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">🛡️</div>
            <div><span class="badge">FastAPI Backend Running (Port 8000)</span></div>
            <h1>StrokeShield AI Backend is Live</h1>
            <p>You have opened the <strong>API server (Port 8000)</strong>. To interact with the web application user interface, open the <strong>Frontend Portal</strong>:</p>
            <a href="http://localhost:5173" class="btn-primary">👉 Open StrokeShield AI Web App (Port 5173)</a>
            <a href="/docs" class="btn-secondary">📖 View Interactive Swagger API Docs (/docs)</a>
        </div>
    </body>
    </html>
    """

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
        "camera_module_ready": True,
        "disclaimer": "Clinical Decision Support Prototype — NOT a definitive diagnostic tool."
    }
