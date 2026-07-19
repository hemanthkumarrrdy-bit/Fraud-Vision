import datetime
import math
import json
from sqlalchemy.orm import Session
from backend import models

HIGH_RISK_COUNTRIES = ["North Korea", "Iran", "Syria", "Cayman Islands", "Panama", "Sudan", "Yemen"]

def calculate_distance(loc1: str, loc2: str) -> float:
    """
    Mock distance calculation. If locations are the same, 0.
    If they are different, we assign a realistic distance:
    If different countries, 5000 km.
    If same country but different cities, 800 km.
    """
    if not loc1 or not loc2:
        return 0.0
    if loc1.lower() == loc2.lower():
        return 0.0
    
    # Simple parsing to check if countries differ
    parts1 = [p.strip().lower() for p in loc1.split(",")]
    parts2 = [p.strip().lower() for p in loc2.split(",")]
    
    if parts1[-1] != parts2[-1]:
        return 5000.0  # Different countries
    return 800.0  # Same country, different cities

def get_rule_config(db: Session, code: str, default_weight: int, default_active: bool, default_condition: dict) -> tuple[bool, int, dict]:
    if db is None:
        return default_active, default_weight, default_condition
    try:
        r = db.query(models.Rule).filter(models.Rule.code == code).first()
        if r:
            condition = default_condition
            if r.condition_value:
                try:
                    condition = json.loads(r.condition_value)
                except Exception:
                    pass
            return r.is_active, r.weight, condition
    except Exception as e:
        # Fallback in case table doesn't exist yet during startup
        pass
    return default_active, default_weight, default_condition

def evaluate_transaction_risk_detailed(db: Session, tx: models.Transaction) -> tuple[int, list[str], list[dict]]:
    reasons = []
    score = 0
    triggered_rules = []

    # 1. Amount Anomaly Check
    is_active, weight, cond = get_rule_config(
        db, "AMOUNT_LIMIT", default_weight=30, default_active=True,
        default_condition={"threshold": 10000.0}
    )
    triggered = False
    added = 0
    reason_msg = None
    if is_active:
        threshold = cond.get("threshold", 10000.0)
        if tx.amount > threshold:
            score += weight
            added = weight
            triggered = True
            reason_msg = f"Abnormal transaction amount: ${tx.amount:,.2f} exceeds standard limit (${threshold:,.0f})"
            reasons.append(reason_msg)
    triggered_rules.append({
        "code": "AMOUNT_LIMIT",
        "name": "Amount Limit Anomaly",
        "triggered": triggered,
        "score_added": added,
        "reason": reason_msg
    })

    # 2. Customer Average Anomaly Check
    is_active, weight, cond = get_rule_config(
        db, "CUSTOMER_AVG_LIMIT", default_weight=20, default_active=True,
        default_condition={"multiplier": 5.0, "min_average": 50.0}
    )
    triggered = False
    added = 0
    reason_msg = None
    if is_active:
        multiplier = cond.get("multiplier", 5.0)
        min_average = cond.get("min_average", 50.0)
        
        # Average amount comparison
        prev_txs = db.query(models.Transaction).filter(
            models.Transaction.customer_id == tx.customer_id,
            models.Transaction.id != tx.id,
            models.Transaction.fraud_status != "FRAUDULENT"
        ).all()

        if prev_txs:
            amounts = [t.amount for t in prev_txs]
            avg_amount = sum(amounts) / len(amounts)
            if len(amounts) >= 3 and tx.amount > multiplier * avg_amount and avg_amount > min_average:
                score += weight
                added = weight
                triggered = True
                reason_msg = f"Transaction amount is {multiplier}x greater than customer's average (${avg_amount:,.2f})"
                reasons.append(reason_msg)
    triggered_rules.append({
        "code": "CUSTOMER_AVG_LIMIT",
        "name": "Customer Average Anomaly",
        "triggered": triggered,
        "score_added": added,
        "reason": reason_msg
    })

    # 3. Location & Velocity Anomaly Checks
    is_active, weight, cond = get_rule_config(
        db, "VELOCITY_LIMIT", default_weight=40, default_active=True,
        default_condition={"max_speed_kmh": 700.0}
    )
    triggered = False
    added = 0
    reason_msg = None
    if is_active:
        max_speed = cond.get("max_speed_kmh", 700.0)
        # Look up customer's immediate previous transaction
        prev_tx = db.query(models.Transaction).filter(
            models.Transaction.customer_id == tx.customer_id,
            models.Transaction.id != tx.id,
            models.Transaction.timestamp < tx.timestamp
        ).order_by(models.Transaction.timestamp.desc()).first()

        if prev_tx:
            time_diff = (tx.timestamp - prev_tx.timestamp).total_seconds()
            dist = calculate_distance(tx.location, prev_tx.location)
            
            if dist > 0:
                if time_diff <= 0:
                    score += weight
                    added = weight
                    triggered = True
                    reason_msg = f"Simultaneous transactions at separate locations: '{tx.location}' and '{prev_tx.location}'"
                    reasons.append(reason_msg)
                else:
                    speed = (dist / (time_diff / 3600.0))
                    if speed > max_speed:
                        score += weight
                        added = weight
                        triggered = True
                        reason_msg = (
                            f"Velocity Anomaly: Travel speed of {speed:.0f} km/h required between "
                            f"'{prev_tx.location}' ({prev_tx.timestamp.strftime('%H:%M:%S')}) and "
                            f"'{tx.location}' ({tx.timestamp.strftime('%H:%M:%S')})"
                        )
                        reasons.append(reason_msg)
    triggered_rules.append({
        "code": "VELOCITY_LIMIT",
        "name": "Velocity & Location Anomaly",
        "triggered": triggered,
        "score_added": added,
        "reason": reason_msg
    })

    # 4. Frequency Anomaly Checks
    is_active, weight, cond = get_rule_config(
        db, "FREQUENCY_LIMIT", default_weight=30, default_active=True,
        default_condition={"window_minutes": 15, "count_threshold": 3}
    )
    triggered = False
    added = 0
    reason_msg = None
    if is_active:
        window_minutes = cond.get("window_minutes", 15)
        count_threshold = cond.get("count_threshold", 3)
        
        fifteen_mins_ago = tx.timestamp - datetime.timedelta(minutes=window_minutes)
        recent_count = db.query(models.Transaction).filter(
            models.Transaction.customer_id == tx.customer_id,
            models.Transaction.timestamp.between(fifteen_mins_ago, tx.timestamp),
            models.Transaction.id != tx.id
        ).count()

        if recent_count >= count_threshold:
            score += weight
            added = weight
            triggered = True
            reason_msg = f"High Frequency: {recent_count + 1} transactions executed within a {window_minutes}-minute window"
            reasons.append(reason_msg)
    triggered_rules.append({
        "code": "FREQUENCY_LIMIT",
        "name": "Frequency Anomaly",
        "triggered": triggered,
        "score_added": added,
        "reason": reason_msg
    })

    # 5. Time Anomaly Checks
    is_active, weight, cond = get_rule_config(
        db, "OFF_HOURS_LIMIT", default_weight=15, default_active=True,
        default_condition={"start_hour": 1, "end_hour": 5, "amount_threshold": 500.0}
    )
    triggered = False
    added = 0
    reason_msg = None
    if is_active:
        start_hour = cond.get("start_hour", 1)
        end_hour = cond.get("end_hour", 5)
        amount_threshold = cond.get("amount_threshold", 500.0)
        
        tx_hour = tx.timestamp.hour
        if (start_hour <= tx_hour <= end_hour) and tx.amount > amount_threshold:
            score += weight
            added = weight
            triggered = True
            reason_msg = f"Time Anomaly: Significant transaction (${tx.amount:,.2f}) executed during off-hours ({tx_hour:02d}:00 AM)"
            reasons.append(reason_msg)
    triggered_rules.append({
        "code": "OFF_HOURS_LIMIT",
        "name": "Off-Hours Anomaly",
        "triggered": triggered,
        "score_added": added,
        "reason": reason_msg
    })

    # 6. Geographic Country Check
    is_active, weight, cond = get_rule_config(
        db, "HIGH_RISK_COUNTRY", default_weight=25, default_active=True,
        default_condition={"countries": HIGH_RISK_COUNTRIES}
    )
    triggered = False
    added = 0
    reason_msg = None
    if is_active:
        risk_countries = cond.get("countries", HIGH_RISK_COUNTRIES)
        risk_countries_lower = [c.lower() for c in risk_countries]
        if tx.country.lower() in risk_countries_lower or any(h.lower() in tx.location.lower() for h in risk_countries_lower):
            score += weight
            added = weight
            triggered = True
            reason_msg = f"Jurisdiction Risk: Transaction processed in high-risk country '{tx.country}'"
            reasons.append(reason_msg)
    triggered_rules.append({
        "code": "HIGH_RISK_COUNTRY",
        "name": "Jurisdiction Risk",
        "triggered": triggered,
        "score_added": added,
        "reason": reason_msg
    })

    # Cap total score at 100
    final_score = min(100, score)
    return final_score, reasons, triggered_rules

def evaluate_transaction_risk(db: Session, tx: models.Transaction) -> tuple[int, list[str]]:
    score, reasons, _ = evaluate_transaction_risk_detailed(db, tx)
    return score, reasons

