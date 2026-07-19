import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings

DATABASE_URL = settings.DATABASE_URL
engine = None
SessionLocal = None

# Attempt to connect to PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    try:
        # We set a connect timeout so it doesn't hang forever if Postgres is offline
        engine = create_engine(
            DATABASE_URL, 
            connect_args={"connect_timeout": 3}
        )
        # Test connection
        conn = engine.connect()
        conn.close()
        print("Connected to PostgreSQL successfully.")
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}. Falling back to SQLite.")
        engine = None

if engine is None:
    # Use local SQLite db
    SQLITE_DATABASE_URL = "sqlite:///./fraud_vision.db"
    print(f"Using SQLite database at {SQLITE_DATABASE_URL}")
    engine = create_engine(
        SQLITE_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
