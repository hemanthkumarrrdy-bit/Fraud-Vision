import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend import models, rules

def test_fraud_rules_engine():
    # Setup in-memory sqlite database for unit testing
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        print("\n--- Running Rules Engine Unit Tests ---")
        
        # Test Vector 1: Standard transaction (should score 0)
        print("Testing standard transaction...")
        tx_normal = models.Transaction(
            tx_id="TX_TEST_001",
            customer_id="C_TEST_01",
            customer_name="Test Customer",
            amount=50.0,
            currency="USD",
            timestamp=datetime.datetime.utcnow(),
            location="New York, US",
            country="US",
            payment_method="Credit Card",
            merchant_category="Retail",
            fraud_status="PENDING"
        )
        db.add(tx_normal)
        db.commit()
        db.refresh(tx_normal)
        
        score, reasons = rules.evaluate_transaction_risk(db, tx_normal)
        assert score == 0, f"Expected 0 risk score, got {score}"
        assert len(reasons) == 0, f"Expected 0 reasons, got {reasons}"
        print("PASSED: Standard transaction passed (Score: 0).")

        # Test Vector 2: High amount transaction (should flag > 10k limit)
        print("Testing abnormal amount threshold (> $10k)...")
        tx_high = models.Transaction(
            tx_id="TX_TEST_002",
            customer_id="C_TEST_01",
            customer_name="Test Customer",
            amount=15000.0,
            currency="USD",
            timestamp=datetime.datetime.utcnow(),
            location="New York, US",
            country="US",
            payment_method="Wire Transfer",
            merchant_category="Financial",
            fraud_status="PENDING"
        )
        db.add(tx_high)
        db.commit()
        db.refresh(tx_high)
        
        score, reasons = rules.evaluate_transaction_risk(db, tx_high)
        assert score >= 30, f"Expected score >= 30, got {score}"
        assert any("exceeds standard limit" in r for r in reasons), "Expected limit warning in reasons"
        print(f"PASSED: High amount check passed (Score: {score}).")

        # Test Vector 3: Time anomaly check (late night + significant amount)
        print("Testing off-hours transaction (time anomaly)...")
        tx_night = models.Transaction(
            tx_id="TX_TEST_003",
            customer_id="C_TEST_01",
            customer_name="Test Customer",
            amount=600.0,
            currency="USD",
            timestamp=datetime.datetime.utcnow().replace(hour=3, minute=0),
            location="New York, US",
            country="US",
            payment_method="Credit Card",
            merchant_category="E-Commerce",
            fraud_status="PENDING"
        )
        db.add(tx_night)
        db.commit()
        db.refresh(tx_night)
        
        score, reasons = rules.evaluate_transaction_risk(db, tx_night)
        assert score >= 15, f"Expected score >= 15, got {score}"
        assert any("Time Anomaly" in r for r in reasons), "Expected time anomaly warning in reasons"
        print(f"PASSED: Time anomaly check passed (Score: {score}).")

        # Test Vector 4: Velocity/Location anomaly (impossible travel speed)
        print("Testing velocity anomaly (impossible physical travel)...")
        # Step A: Normal location transaction in NY
        tx_velocity_1 = models.Transaction(
            tx_id="TX_TEST_V1",
            customer_id="C_TEST_02",
            customer_name="Traveler Customer",
            amount=100.0,
            currency="USD",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=10),
            location="New York, US",
            country="US",
            payment_method="Credit Card",
            merchant_category="Restaurant",
            fraud_status="APPROVED"
        )
        db.add(tx_velocity_1)
        db.commit()
        
        # Step B: Transaction 10 minutes later in London, UK (impossible distance of 5000 km)
        tx_velocity_2 = models.Transaction(
            tx_id="TX_TEST_V2",
            customer_id="C_TEST_02",
            customer_name="Traveler Customer",
            amount=200.0,
            currency="GBP",
            timestamp=datetime.datetime.utcnow(),
            location="London, UK",
            country="UK",
            payment_method="Credit Card",
            merchant_category="E-Commerce",
            fraud_status="PENDING"
        )
        db.add(tx_velocity_2)
        db.commit()
        db.refresh(tx_velocity_2)
        
        score, reasons = rules.evaluate_transaction_risk(db, tx_velocity_2)
        assert score >= 40, f"Expected score >= 40, got {score}"
        assert any("Velocity Anomaly" in r for r in reasons), f"Expected Velocity Anomaly in reasons: {reasons}"
        print(f"PASSED: Velocity/Location anomaly check passed (Score: {score}).")

        print("Rules engine unit tests completed successfully!")

    finally:
        db.close()

def test_rules_api_endpoints():
    from backend.routes.rules import list_rules, update_rule, simulate_transaction
    from backend.schemas import RuleUpdate, TransactionSimulateInput
    
    print("\n--- Running Rules API Endpoint Unit Tests ---")
    
    # Setup test database
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        # Seed rules
        from backend.seed import seed_rules
        seed_rules(db)
        
        # Seed a test user
        user = models.User(
            username="test_admin",
            hashed_password="some_hashed_password",
            email="admin@test.com",
            role="Admin"
        )
        db.add(user)
        db.commit()
        
        # 1. Test GET /api/rules/
        print("Testing list_rules function...")
        rules_data = list_rules(db=db, current_user=user)
        assert len(rules_data) == 6, f"Expected 6 rules, got {len(rules_data)}"
        print("PASSED: list_rules function.")
        
        # 2. Test PUT /api/rules/{code}
        print("Testing update_rule function...")
        rule_updated = update_rule(code="AMOUNT_LIMIT", rule_in=RuleUpdate(weight=55), db=db, current_user=user)
        assert rule_updated.weight == 55, "Rule weight should be updated to 55"
        print("PASSED: update_rule function.")
        
        # 3. Test POST /api/rules/simulate
        print("Testing simulate_transaction function...")
        sim_payload = TransactionSimulateInput(
            customer_id="C_TEST_SIM",
            customer_name="Simulated Customer",
            amount=15000.0,  # exceeds AMOUNT_LIMIT threshold (10000.0)
            location="New York, US",
            country="US",
            payment_method="Credit Card",
            merchant_category="Retail"
        )
        res_data = simulate_transaction(sim_in=sim_payload, db=db, current_user=user)
        assert res_data.risk_score >= 55, f"Expected risk score >= 55, got {res_data.risk_score}"
        assert any(r.code == "AMOUNT_LIMIT" and r.triggered for r in res_data.triggered_rules), "Expected AMOUNT_LIMIT triggered"
        print("PASSED: simulate_transaction function.")
        
        print("All API endpoint unit tests passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_fraud_rules_engine()
    test_rules_api_endpoints()
