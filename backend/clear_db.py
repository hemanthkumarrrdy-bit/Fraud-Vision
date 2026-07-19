import sys
from backend.database import SessionLocal, engine
from backend import models

def clear_data():
    db = SessionLocal()
    try:
        print("Clearing database tables...")
        
        # Delete transaction-related data
        num_deleted_tx = db.query(models.Transaction).delete()
        print(f"Deleted {num_deleted_tx} transactions.")
        
        num_deleted_cust = db.query(models.CustomerProfile).delete()
        print(f"Deleted {num_deleted_cust} customer profiles.")
        
        num_deleted_notif = db.query(models.Notification).delete()
        print(f"Deleted {num_deleted_notif} notifications.")
        
        num_deleted_audit = db.query(models.AuditLog).delete()
        print(f"Deleted {num_deleted_audit} audit logs.")
        
        num_deleted_reports = db.query(models.ScheduledReport).delete()
        print(f"Deleted {num_deleted_reports} scheduled reports.")
        
        db.commit()
        print("Database cleared successfully (except users and rules).")
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()
