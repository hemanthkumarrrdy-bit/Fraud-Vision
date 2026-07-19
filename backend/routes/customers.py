import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from backend import models, schemas, auth
from backend.database import get_db

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("/", response_model=schemas.CustomerListResponse)
def list_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    search: Optional[str] = None,
    kyc_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = db.query(models.CustomerProfile)
    
    if search:
        query = query.filter(
            (models.CustomerProfile.customer_name.ilike(f"%{search}%")) |
            (models.CustomerProfile.customer_id.ilike(f"%{search}%"))
        )
    if kyc_status:
        query = query.filter(models.CustomerProfile.kyc_status == kyc_status)
        
    total = query.count()
    items = query.order_by(models.CustomerProfile.customer_name).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/{customer_id}", response_model=schemas.CustomerDetailResponse)
def get_customer_details(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Fetch profile
    profile = db.query(models.CustomerProfile).filter(models.CustomerProfile.customer_id == customer_id).first()
    if not profile:
        # Fallback if profile not found, check transactions
        tx_exist = db.query(models.Transaction).filter(models.Transaction.customer_id == customer_id).first()
        if tx_exist:
            # Create a profile dynamically to recover database consistency
            profile = models.CustomerProfile(
                customer_id=customer_id,
                customer_name=tx_exist.customer_name,
                kyc_status="PENDING_VERIFICATION",
                kyc_notes="Profile generated automatically. KYC verification pending."
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        else:
            raise HTTPException(status_code=404, detail="Customer profile not found")
            
    # Calculate stats
    stats = db.query(
        func.sum(models.Transaction.amount).label("total_spent"),
        func.count(models.Transaction.id).label("tx_count"),
        func.max(models.Transaction.risk_score).label("max_risk"),
        func.avg(models.Transaction.risk_score).label("avg_risk")
    ).filter(models.Transaction.customer_id == customer_id).first()
    
    total_spent = float(stats.total_spent or 0.0)
    tx_count = int(stats.tx_count or 0)
    max_risk = int(stats.max_risk or 0)
    avg_risk = float(stats.avg_risk or 0.0)
    
    # Fetch transactions
    transactions = db.query(models.Transaction).filter(
        models.Transaction.customer_id == customer_id
    ).order_by(models.Transaction.timestamp.desc()).all()
    
    return {
        "profile": profile,
        "total_spent": total_spent,
        "transaction_count": tx_count,
        "max_risk_score": max_risk,
        "avg_risk_score": avg_risk,
        "transactions": transactions
    }

@router.put("/{customer_id}/kyc", response_model=schemas.CustomerProfileResponse)
def update_customer_kyc(
    customer_id: str,
    update_data: schemas.CustomerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Compliance Officer"]))
):
    profile = db.query(models.CustomerProfile).filter(models.CustomerProfile.customer_id == customer_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Customer profile not found")
        
    old_status = profile.kyc_status
    new_status = update_data.kyc_status
    
    if new_status not in ["VERIFIED", "HIGH_RISK", "SUSPENDED", "PENDING_VERIFICATION"]:
        raise HTTPException(status_code=400, detail="Invalid KYC status status")
        
    profile.kyc_status = new_status
    if update_data.kyc_notes:
        profile.kyc_notes = update_data.kyc_notes
        
    profile.last_reviewed = datetime.datetime.utcnow()
    
    # Log to audit trail (using dummy transaction ID or a generic marker)
    audit_log = models.AuditLog(
        tx_id=f"CUSTOMER_KYC_{customer_id}",
        username=current_user.username,
        action=f"Updated KYC from {old_status} to {new_status}",
        details=f"KYC Notes: {update_data.kyc_notes or 'No notes left'}"
    )
    db.add(audit_log)
    db.commit()
    db.refresh(profile)
    return profile
