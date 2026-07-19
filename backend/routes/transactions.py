import csv
import json
import io
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend import models, schemas, auth, rules
from backend.database import get_db
from backend.websocket_manager import manager

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.get("/", response_model=schemas.TransactionListResponse)
def list_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    search: Optional[str] = None,
    status: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    min_risk: Optional[int] = None,
    country: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = db.query(models.Transaction)
    
    if search:
        query = query.filter(
            (models.Transaction.customer_name.ilike(f"%{search}%")) |
            (models.Transaction.customer_id.ilike(f"%{search}%")) |
            (models.Transaction.tx_id.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(models.Transaction.fraud_status == status)
    if min_amount is not None:
        query = query.filter(models.Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(models.Transaction.amount <= max_amount)
    if min_risk is not None:
        query = query.filter(models.Transaction.risk_score >= min_risk)
    if country:
        query = query.filter(models.Transaction.country.ilike(f"%{country}%"))
        
    total = query.count()
    items = query.order_by(models.Transaction.timestamp.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/{tx_id}", response_model=schemas.TransactionResponse)
def get_transaction(
    tx_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    tx = db.query(models.Transaction).filter(models.Transaction.tx_id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.put("/{tx_id}/status", response_model=schemas.TransactionResponse)
async def update_transaction_status(
    tx_id: str,
    update_data: schemas.TransactionUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Risk Analyst", "Compliance Officer"]))
):
    tx = db.query(models.Transaction).filter(models.Transaction.tx_id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    old_status = tx.fraud_status
    new_status = update_data.fraud_status
    
    if new_status not in ["PENDING", "APPROVED", "FRAUDULENT"]:
        raise HTTPException(status_code=400, detail="Invalid fraud status")
        
    tx.fraud_status = new_status
    if update_data.note:
        timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        appended_note = f"\n[{timestamp_str} - {current_user.username} ({current_user.role})]: {update_data.note}"
        tx.notes = (tx.notes or "") + appended_note
        
    # Write audit log
    audit_log = models.AuditLog(
        tx_id=tx_id,
        username=current_user.username,
        action=f"Changed status from {old_status} to {new_status}",
        details=f"Note: {update_data.note or 'No notes left'}"
    )
    db.add(audit_log)
    db.commit()
    db.refresh(tx)
    
    # Broadcast status update
    tx_dict = {
        "id": tx.id,
        "tx_id": tx.tx_id,
        "customer_id": tx.customer_id,
        "customer_name": tx.customer_name,
        "amount": tx.amount,
        "currency": tx.currency,
        "timestamp": tx.timestamp.isoformat(),
        "location": tx.location,
        "country": tx.country,
        "payment_method": tx.payment_method,
        "merchant_category": tx.merchant_category,
        "risk_score": tx.risk_score,
        "fraud_status": tx.fraud_status,
        "suspicious_reasons": tx.suspicious_reasons,
        "notes": tx.notes,
        "updated_at": tx.updated_at.isoformat()
    }
    await manager.broadcast({
        "type": "STATUS_UPDATE",
        "data": tx_dict
    })
    
    return tx

@router.post("/import")
async def import_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Risk Analyst"]))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV")
        
    contents = await file.read()
    string_data = contents.decode("utf-8")
    csv_file = io.StringIO(string_data)
    reader = csv.DictReader(csv_file)
    
    imported_count = 0
    duplicate_count = 0
    high_risk_count = 0
    errors = []
    
    for idx, row in enumerate(reader):
        try:
            tx_id = row.get("tx_id")
            if not tx_id:
                errors.append(f"Row {idx+1}: Missing tx_id")
                continue
                
            # Check for duplicates
            exists = db.query(models.Transaction).filter(models.Transaction.tx_id == tx_id).first()
            if exists:
                duplicate_count += 1
                continue
            
            # Parse dates
            date_str = row.get("timestamp")
            if date_str:
                try:
                    # supports multiple common formats
                    timestamp = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except ValueError:
                    try:
                        timestamp = datetime.datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        timestamp = datetime.datetime.utcnow()
            else:
                timestamp = datetime.datetime.utcnow()
                
            # Create transaction object
            tx = models.Transaction(
                tx_id=tx_id,
                customer_id=row.get("customer_id", "UNKNOWN"),
                customer_name=row.get("customer_name", "Unknown Customer"),
                amount=float(row.get("amount", 0.0)),
                currency=row.get("currency", "USD"),
                timestamp=timestamp,
                location=row.get("location", "Unknown Location"),
                country=row.get("country", "Unknown Country"),
                payment_method=row.get("payment_method", "Credit Card"),
                merchant_category=row.get("merchant_category", "Retail"),
                fraud_status="PENDING",
                notes=""
            )
            
            # Save it so we can run rules (velocity requires historical queries)
            db.add(tx)
            db.commit()
            db.refresh(tx)
            
            # Run rules engine
            score, reasons = rules.evaluate_transaction_risk(db, tx)
            tx.risk_score = score
            tx.suspicious_reasons = json.dumps(reasons)
            db.commit()
            
            imported_count += 1
            
            # Broadcast the new transaction
            tx_dict = {
                "id": tx.id,
                "tx_id": tx.tx_id,
                "customer_id": tx.customer_id,
                "customer_name": tx.customer_name,
                "amount": tx.amount,
                "currency": tx.currency,
                "timestamp": tx.timestamp.isoformat(),
                "location": tx.location,
                "country": tx.country,
                "payment_method": tx.payment_method,
                "merchant_category": tx.merchant_category,
                "risk_score": tx.risk_score,
                "fraud_status": tx.fraud_status,
                "suspicious_reasons": tx.suspicious_reasons,
                "notes": tx.notes,
                "updated_at": tx.updated_at.isoformat()
            }
            await manager.broadcast({
                "type": "NEW_TRANSACTION",
                "data": tx_dict
            })
            
            # Alert on high risk
            if score >= 60:
                high_risk_count += 1
                level = "CRITICAL" if score >= 80 else "WARNING"
                message = f"High Risk Alert: Imported transaction {tx.tx_id} ({tx.customer_name}) scored {score}/100."
                notif = models.Notification(
                    tx_id=tx.tx_id,
                    message=message,
                    level=level,
                    is_read=False
                )
                db.add(notif)
                db.commit()
                db.refresh(notif)
                
                notif_dict = {
                    "id": notif.id,
                    "tx_id": notif.tx_id,
                    "message": notif.message,
                    "level": notif.level,
                    "is_read": notif.is_read,
                    "timestamp": notif.timestamp.isoformat()
                }
                await manager.broadcast({
                    "type": "NEW_ALERT",
                    "data": notif_dict
                })
                
        except Exception as e:
            db.rollback()
            errors.append(f"Row {idx+1}: Exception {str(e)}")
            
    return {
        "success": True,
        "imported": imported_count,
        "duplicates_skipped": duplicate_count,
        "high_risk_flagged": high_risk_count,
        "errors": errors
    }

@router.get("/{tx_id}/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_transaction_audit_logs(
    tx_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    logs = db.query(models.AuditLog).filter(models.AuditLog.tx_id == tx_id).order_by(models.AuditLog.timestamp.desc()).all()
    return logs
