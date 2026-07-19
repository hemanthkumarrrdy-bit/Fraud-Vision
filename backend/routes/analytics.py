from fastapi import APIRouter, Depends
from sqlalchemy import func, distinct, case
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from backend import models, schemas, auth
from backend.database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/kpis", response_model=schemas.DashboardKPIs)
def get_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    total_txs = db.query(models.Transaction).count()
    total_vol = db.query(func.sum(models.Transaction.amount)).scalar() or 0.0
    
    fraud_txs = db.query(models.Transaction).filter(models.Transaction.fraud_status == "FRAUDULENT").count()
    fraud_vol = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.fraud_status == "FRAUDULENT").scalar() or 0.0
    
    high_risk_custs = db.query(func.count(distinct(models.Transaction.customer_id))).filter(
        models.Transaction.risk_score >= 70
    ).scalar() or 0
    
    pending_inv = db.query(models.Transaction).filter(
        models.Transaction.fraud_status == "PENDING",
        models.Transaction.risk_score >= 60
    ).count()
    
    return {
        "total_transactions": total_txs,
        "total_volume": float(total_vol),
        "fraudulent_transactions": fraud_txs,
        "fraudulent_volume": float(fraud_vol),
        "high_risk_customers": high_risk_custs,
        "pending_investigations": pending_inv
    }

@router.get("/trends", response_model=List[schemas.DailyTrendItem])
def get_daily_trends(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Fetch last 30 days trends
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # We do the aggregation in Python to ensure perfect cross-database date formatting 
    # (sqlite strftime vs postgres to_char is notoriously incompatible)
    txs = db.query(
        models.Transaction.timestamp,
        models.Transaction.amount,
        models.Transaction.fraud_status
    ).filter(models.Transaction.timestamp >= thirty_days_ago).all()
    
    daily_data = {}
    
    # Fill in all days in range to ensure no gaps in chart
    for i in range(31):
        d_str = (thirty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_data[d_str] = {
            "date": d_str,
            "total_count": 0,
            "fraud_count": 0,
            "total_amount": 0.0,
            "fraud_amount": 0.0
        }
        
    for t in txs:
        d_str = t.timestamp.strftime("%Y-%m-%d")
        if d_str in daily_data:
            daily_data[d_str]["total_count"] += 1
            daily_data[d_str]["total_amount"] += t.amount
            if t.fraud_status == "FRAUDULENT":
                daily_data[d_str]["fraud_count"] += 1
                daily_data[d_str]["fraud_amount"] += t.amount
                
    # Sort and return
    return sorted(list(daily_data.values()), key=lambda x: x["date"])

@router.get("/country", response_model=List[schemas.CountryFraudItem])
def get_fraud_by_country(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    results = db.query(
        models.Transaction.country,
        func.count(models.Transaction.id).label("count"),
        func.sum(models.Transaction.amount).label("amount"),
        func.sum(
            case(
                (models.Transaction.fraud_status == "FRAUDULENT", 1),
                else_=0
            )
        ).label("fraud_count"),
        func.sum(
            case(
                (models.Transaction.fraud_status == "FRAUDULENT", models.Transaction.amount),
                else_=0.0
            )
        ).label("fraud_amount")
    ).group_by(models.Transaction.country).all()
    
    res_list = []
    for r in results:
        res_list.append({
            "country": r[0] or "Unknown",
            "count": r[1] or 0,
            "amount": float(r[2] or 0.0),
            "fraud_count": int(r[3] or 0),
            "fraud_amount": float(r[4] or 0.0)
        })
        
    return res_list

@router.get("/payment-method", response_model=List[schemas.PaymentMethodFraudItem])
def get_fraud_by_payment_method(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    results = db.query(
        models.Transaction.payment_method,
        func.count(models.Transaction.id).label("count"),
        func.sum(models.Transaction.amount).label("amount"),
        func.sum(
            case(
                (models.Transaction.fraud_status == "FRAUDULENT", 1),
                else_=0
            )
        ).label("fraud_count"),
        func.sum(
            case(
                (models.Transaction.fraud_status == "FRAUDULENT", models.Transaction.amount),
                else_=0.0
            )
        ).label("fraud_amount")
    ).group_by(models.Transaction.payment_method).all()
    
    res_list = []
    for r in results:
        res_list.append({
            "payment_method": r[0] or "Unknown",
            "count": r[1] or 0,
            "amount": float(r[2] or 0.0),
            "fraud_count": int(r[3] or 0),
            "fraud_amount": float(r[4] or 0.0)
        })
        
    return res_list

@router.get("/risky-customers", response_model=List[schemas.RiskyCustomerItem])
def get_risky_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    results = db.query(
        models.Transaction.customer_id,
        models.Transaction.customer_name,
        func.max(models.Transaction.risk_score).label("max_score"),
        func.avg(models.Transaction.risk_score).label("avg_score"),
        func.count(models.Transaction.id).label("tx_count"),
        func.sum(models.Transaction.amount).label("total_spent")
    ).group_by(models.Transaction.customer_id, models.Transaction.customer_name)\
     .order_by(func.max(models.Transaction.risk_score).desc())\
     .limit(10).all()
     
    res_list = []
    for r in results:
        res_list.append({
            "customer_id": r[0],
            "customer_name": r[1],
            "risk_score_max": r[2] or 0,
            "risk_score_avg": float(r[3] or 0.0),
            "transaction_count": r[4] or 0,
            "total_spent": float(r[5] or 0.0)
        })
        
    return res_list
