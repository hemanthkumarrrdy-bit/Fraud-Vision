import os

class Settings:
    PROJECT_NAME: str = "Fraud Vision API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "goldman_sachs_secret_key_change_me_in_production_123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database URL. If none is set, we will use SQLite fallback in database.py
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fraud_vision")
    
    # SMTP details for Notifications
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.mailtrap.io")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "2525"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "alerts@fraudvision.com")

settings = Settings()
