import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas, auth, rules
from backend.database import get_db

router = APIRouter(prefix="/api/rules", tags=["rules"])

@router.get("/", response_model=List[schemas.RuleResponse])
def list_rules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Rule).all()

@router.put("/{code}", response_model=schemas.RuleResponse)
def update_rule(
    code: str,
    rule_in: schemas.RuleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    rule = db.query(models.Rule).filter(models.Rule.code == code).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    if rule_in.is_active is not None:
        rule.is_active = rule_in.is_active
    if rule_in.weight is not None:
        if not (0 <= rule_in.weight <= 100):
            raise HTTPException(status_code=400, detail="Weight must be between 0 and 100")
        rule.weight = rule_in.weight
    if rule_in.condition_value is not None:
        try:
            # Validate JSON format
            json.loads(rule_in.condition_value)
            rule.condition_value = rule_in.condition_value
        except Exception:
            raise HTTPException(status_code=400, detail="Condition value must be valid JSON")
            
    db.commit()
    db.refresh(rule)
    return rule

@router.post("/simulate", response_model=schemas.TransactionSimulateResponse)
def simulate_transaction(
    sim_in: schemas.TransactionSimulateInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Create transient transaction object
    tx = models.Transaction(
        tx_id="TX_SIMULATED",
        customer_id=sim_in.customer_id,
        customer_name=sim_in.customer_name,
        amount=sim_in.amount,
        currency=sim_in.currency,
        timestamp=datetime.datetime.utcnow(),
        location=sim_in.location,
        country=sim_in.country,
        payment_method=sim_in.payment_method,
        merchant_category=sim_in.merchant_category,
        fraud_status="PENDING"
    )
    
    # Run evaluation
    score, reasons, triggered_rules = rules.evaluate_transaction_risk_detailed(db, tx)
    
    # Format to match TransactionSimulateResponse schema
    exec_details = []
    for r in triggered_rules:
        exec_details.append(
            schemas.RuleExecutionDetail(
                code=r["code"],
                name=r["name"],
                triggered=r["triggered"],
                score_added=r["score_added"],
                reason=r["reason"]
            )
        )
        
    return schemas.TransactionSimulateResponse(
        risk_score=score,
        triggered_rules=exec_details,
        reasons=reasons
    )
