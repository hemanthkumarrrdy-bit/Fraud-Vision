import datetime
from backend.database import SessionLocal, Base, engine
from backend import models

def seed_customer_profiles_only():
    print("Re-creating customer profile table if not exists...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Querying distinct customers from transactions...")
        distinct_customers = db.query(models.Transaction.customer_id, models.Transaction.customer_name).distinct().all()
        
        customer_profiles = []
        for cust_id, cust_name in distinct_customers:
            exists = db.query(models.CustomerProfile).filter(models.CustomerProfile.customer_id == cust_id).first()
            if not exists:
                kyc_status = "VERIFIED"
                kyc_notes = "Verified via standard KYC process."
                
                if "vladislav" in cust_name.lower():
                    kyc_status = "SUSPENDED"
                    kyc_notes = "Linked to suspicious crypto transactions and foreign accounts under sanctions review."
                elif "david" in cust_name.lower():
                    kyc_status = "PENDING_VERIFICATION"
                    kyc_notes = "Velocity anomaly triggered. Awaiting document verification."
                elif "shell corp" in cust_name.lower():
                    kyc_status = "HIGH_RISK"
                    kyc_notes = "Corporate structure complex. Enhanced due diligence required."
                elif "sterling" in cust_name.lower():
                    kyc_status = "VERIFIED"
                    kyc_notes = "Standard account verified. Checked frequency patterns."

                profile = models.CustomerProfile(
                    customer_id=cust_id,
                    customer_name=cust_name,
                    kyc_status=kyc_status,
                    kyc_notes=kyc_notes,
                    last_reviewed=datetime.datetime.utcnow()
                )
                customer_profiles.append(profile)
                print(f"Adding customer: {cust_name} ({cust_id}) -> {kyc_status}")

        if customer_profiles:
            db.add_all(customer_profiles)
            db.commit()
            print(f"Successfully seeded {len(customer_profiles)} customer profiles.")
        else:
            print("No new customer profiles to seed.")
            
    except Exception as e:
        db.rollback()
        print(f"Error during customer profiles seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_customer_profiles_only()
