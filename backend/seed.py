import datetime
import json
import random
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend import models, auth, rules

def seed_rules(db: Session):
    if db.query(models.Rule).count() > 0:
        return
    print("Seeding rules...")
    rules = [
        models.Rule(
            code="AMOUNT_LIMIT",
            name="Amount Limit Anomaly",
            description="Flags transactions that exceed a fixed maximum amount threshold.",
            is_active=True,
            weight=30,
            condition_value=json.dumps({"threshold": 10000.0})
        ),
        models.Rule(
            code="CUSTOMER_AVG_LIMIT",
            name="Customer Average Anomaly",
            description="Flags transactions that exceed the customer's historical average amount by a multiplier.",
            is_active=True,
            weight=20,
            condition_value=json.dumps({"multiplier": 5.0, "min_average": 50.0})
        ),
        models.Rule(
            code="VELOCITY_LIMIT",
            name="Velocity & Location Anomaly",
            description="Flags transactions from different locations that require physically impossible travel speeds.",
            is_active=True,
            weight=40,
            condition_value=json.dumps({"max_speed_kmh": 700.0})
        ),
        models.Rule(
            code="FREQUENCY_LIMIT",
            name="Frequency Anomaly",
            description="Flags customers executing too many transactions within a short time window.",
            is_active=True,
            weight=30,
            condition_value=json.dumps({"window_minutes": 15, "count_threshold": 3})
        ),
        models.Rule(
            code="OFF_HOURS_LIMIT",
            name="Off-Hours Anomaly",
            description="Flags significant transactions executed during high-risk off-hours.",
            is_active=True,
            weight=15,
            condition_value=json.dumps({"start_hour": 1, "end_hour": 5, "amount_threshold": 500.0})
        ),
        models.Rule(
            code="HIGH_RISK_COUNTRY",
            name="Jurisdiction Risk",
            description="Flags transactions executed in high-risk countries under international sanctions.",
            is_active=True,
            weight=25,
            condition_value=json.dumps({"countries": ["North Korea", "Iran", "Syria", "Cayman Islands", "Panama", "Sudan", "Yemen"]})
        )
    ]
    db.add_all(rules)
    db.commit()
    print("Rules seeded successfully.")

def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Seed rules table first
        seed_rules(db)
        
        # Check if users already exist
        if db.query(models.User).count() > 0:
            print("Database already seeded. Skipping...")
            return

        print("Seeding Users...")
        users = [
            models.User(
                username="admin",
                hashed_password=auth.get_password_hash("admin123"),
                email="admin@fraudvision.com",
                role="Admin"
            ),
            models.User(
                username="analyst",
                hashed_password=auth.get_password_hash("analyst123"),
                email="analyst@fraudvision.com",
                role="Risk Analyst"
            ),
            models.User(
                username="compliance",
                hashed_password=auth.get_password_hash("compliance123"),
                email="compliance@fraudvision.com",
                role="Compliance Officer"
            )
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Transactions and running Fraud Engine...")
        
        countries = [
            ("US", "New York, NY", "USD"), 
            ("UK", "London", "GBP"), 
            ("JP", "Tokyo", "JPY"), 
            ("DE", "Frankfurt", "EUR"), 
            ("CH", "Zurich", "CHF"), 
            ("SG", "Singapore", "SGD"), 
            ("HK", "Hong Kong", "HKD"), 
            ("AU", "Sydney", "AUD")
        ]
        
        merchants = ["Retail Shop", "E-Commerce", "High-End Jewelry", "Crypto Exchange", "Online Casino", "Gas Station", "Restaurant"]
        payment_methods = ["Credit Card", "Wire Transfer", "ACH", "Crypto"]
        
        now = datetime.datetime.utcnow()
        transactions = []
        
        # 1. First, seed simple historical records to build normal patterns
        # For customer C1001 (will trigger velocity anomaly)
        tx_c1001_1 = models.Transaction(
            tx_id="TX_1001001", customer_id="C1001", customer_name="David Vance",
            amount=120.0, currency="USD", timestamp=now - datetime.timedelta(hours=24),
            location="New York, US", country="US", payment_method="Credit Card",
            merchant_category="Retail Shop", fraud_status="APPROVED"
        )
        transactions.append(tx_c1001_1)

        # For customer C1002 (will trigger frequency anomaly)
        for i in range(3):
            tx_c1002_prev = models.Transaction(
                tx_id=f"TX_100200{i+1}", customer_id="C1002", customer_name="Alice Sterling",
                amount=75.0 + (i*10), currency="EUR", timestamp=now - datetime.timedelta(minutes=40 - i*5),
                location="Paris, FR", country="FR", payment_method="Credit Card",
                merchant_category="E-Commerce", fraud_status="APPROVED"
            )
            transactions.append(tx_c1002_prev)
            
        # For customer C1004 (will trigger amount > 5x average)
        for i in range(4):
            tx_c1004_prev = models.Transaction(
                tx_id=f"TX_100400{i+1}", customer_id="C1004", customer_name="Gregory Peck",
                amount=40.0 + random.randint(-5, 10), currency="USD", timestamp=now - datetime.timedelta(days=i+2),
                location="Chicago, US", country="US", payment_method="ACH",
                merchant_category="Gas Station", fraud_status="APPROVED"
            )
            transactions.append(tx_c1004_prev)

        # Write these background records first so the next ones can evaluate them
        db.add_all(transactions)
        db.commit()
        transactions = []

        # 2. Add the anomalies that our rules engine will catch
        anomalous_txs = [
            # Velocity Anomaly (David Vance in London 5 minutes after NY)
            models.Transaction(
                tx_id="TX_1001002", customer_id="C1001", customer_name="David Vance",
                amount=850.0, currency="GBP", timestamp=now - datetime.timedelta(minutes=5),
                location="London, UK", country="UK", payment_method="Credit Card",
                merchant_category="E-Commerce", fraud_status="PENDING"
            ),
            # Frequency Anomaly (Alice Sterling makes 4th transaction within a 15 min window)
            models.Transaction(
                tx_id="TX_1002004", customer_id="C1002", customer_name="Alice Sterling",
                amount=245.0, currency="EUR", timestamp=now - datetime.timedelta(minutes=1),
                location="Paris, FR", country="FR", payment_method="Credit Card",
                merchant_category="E-Commerce", fraud_status="PENDING"
            ),
            # Country and Time Anomaly (Cayman Islands, $12,500, late night)
            models.Transaction(
                tx_id="TX_1003001", customer_id="C1003", customer_name="Shell Corp LLC",
                amount=12500.0, currency="USD", timestamp=now.replace(hour=2, minute=15),
                location="George Town, Cayman Islands", country="Cayman Islands", payment_method="Wire Transfer",
                merchant_category="Crypto Exchange", fraud_status="PENDING"
            ),
            # 5x Average Anomaly (Gregory Peck makes an $800 gas/retail purchase when average is ~$45)
            models.Transaction(
                tx_id="TX_1004005", customer_id="C1004", customer_name="Gregory Peck",
                amount=800.0, currency="USD", timestamp=now - datetime.timedelta(minutes=10),
                location="Chicago, US", country="US", payment_method="Credit Card",
                merchant_category="High-End Jewelry", fraud_status="PENDING"
            ),
            # Super fraud (multiple flags: >$10k, high risk country, time anomaly)
            models.Transaction(
                tx_id="TX_1005001", customer_id="C1005", customer_name="Vladislav Rostova",
                amount=25000.0, currency="USD", timestamp=now.replace(hour=3, minute=45),
                location="Tehran, Iran", country="Iran", payment_method="Crypto",
                merchant_category="Crypto Exchange", fraud_status="PENDING"
            )
        ]
        db.add_all(anomalous_txs)
        db.commit()

        # 3. Seed random historical transactions (over last 30 days) to make analytics graphs look stunning
        print("Seeding historical analytics dataset...")
        analytics_txs = []
        names = ["James Bond", "Sarah Connor", "Bruce Wayne", "Clark Kent", "Peter Parker", "Diana Prince", "Tony Stark", "Steve Rogers", "Natasha Romanoff", "Wanda Maximoff"]
        
        for i in range(120):
            country_info = random.choice(countries)
            p_method = random.choice(payment_methods)
            merchant = random.choice(merchants)
            cust_name = random.choice(names)
            cust_id = f"C{1000 + names.index(cust_name)}"
            
            # Scatter amounts: most are small, some are medium, a few are high
            amount = round(random.exponential(scale=350.0) + 10.0, 2)
            if random.random() < 0.05:
                amount = round(amount * 10 + 1000.0, 2)
                
            # Random date within last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            tx_time = now - datetime.timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            # Status distribution
            status_rand = random.random()
            if status_rand < 0.85:
                f_status = "APPROVED"
            elif status_rand < 0.95:
                f_status = "PENDING"
            else:
                f_status = "FRAUDULENT"
                
            tx_id = f"TX_HIST{100000 + i}"
            tx = models.Transaction(
                tx_id=tx_id, customer_id=cust_id, customer_name=cust_name,
                amount=amount, currency=country_info[2], timestamp=tx_time,
                location=country_info[1], country=country_info[0], payment_method=p_method,
                merchant_category=merchant, fraud_status=f_status
            )
            analytics_txs.append(tx)
            
        db.add_all(analytics_txs)
        db.commit()

        # 4. Run risk evaluations for ALL transactions in the DB to populate risk scores and justifications
        print("Running risk engine on all transactions...")
        all_txs = db.query(models.Transaction).all()
        notifications = []
        for t in all_txs:
            score, reasons = rules.evaluate_transaction_risk(db, t)
            t.risk_score = score
            t.suspicious_reasons = json.dumps(reasons)
            
            # If the transaction is pending or fraudulent and has a high risk score, create a notification
            if score >= 60 and (t.fraud_status == "PENDING" or t.fraud_status == "FRAUDULENT"):
                level = "CRITICAL" if score >= 80 else "WARNING"
                notif = models.Notification(
                    tx_id=t.tx_id,
                    message=f"High Risk Alert: Transaction {t.tx_id} ({t.customer_name}) scored {score}/100. Reasons: {', '.join(reasons[:2])}",
                    level=level,
                    is_read=False,
                    timestamp=t.timestamp
                )
                notifications.append(notif)
                
        db.add_all(notifications)
        db.commit()

        # 4.5. Seed Customer Profiles
        print("Seeding customer KYC profiles...")
        # Get distinct customers from transactions
        distinct_customers = db.query(models.Transaction.customer_id, models.Transaction.customer_name).distinct().all()
        customer_profiles = []
        for cust_id, cust_name in distinct_customers:
            # Check if profile already exists
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

        if customer_profiles:
            db.add_all(customer_profiles)
            db.commit()

        # 5. Seed some scheduled reports
        print("Seeding scheduled reports...")
        reports = [
            models.ScheduledReport(
                name="Daily Executive Fraud Summary",
                frequency="DAILY",
                format="PDF",
                next_run=datetime.datetime.utcnow() + datetime.timedelta(days=1),
                active=True,
                email_recipient="compliance@fraudvision.com"
            ),
            models.ScheduledReport(
                name="Weekly Transaction Risk Audit Log",
                frequency="WEEKLY",
                format="EXCEL",
                next_run=datetime.datetime.utcnow() + datetime.timedelta(days=7),
                active=True,
                email_recipient="audit@fraudvision.com"
            )
        ]
        db.add_all(reports)
        db.commit()

        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
