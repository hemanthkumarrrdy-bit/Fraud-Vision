from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.database import engine, Base
from backend.routes import auth, transactions, analytics, reports, notifications, customers, rules
from backend.seed import seed_db
from backend.config import settings

app = FastAPI(title="Fraud Vision API", version="1.0.0")

# Setup CORS to allow React Frontend
# During local development, React runs on http://localhost:5173 or http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development we allow all; for production we can restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include subrouters
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(customers.router)
app.include_router(rules.router)

@app.on_event("startup")
def on_startup():
    print("Database startup checks...")
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        # Seed database if empty
        seed_db()
    except Exception as e:
        print(f"Error during startup seeding: {e}")

@app.get("/")
def index():
    return {
        "status": "online",
        "service": "Fraud Vision API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
