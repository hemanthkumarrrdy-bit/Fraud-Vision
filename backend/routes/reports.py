import io
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
from backend import models, schemas, auth
from backend.database import get_db

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/pdf")
def generate_pdf_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Fetch data
    total_txs = db.query(models.Transaction).count()
    fraud_txs = db.query(models.Transaction).filter(models.Transaction.fraud_status == "FRAUDULENT").count()
    fraud_vol = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.fraud_status == "FRAUDULENT").scalar() or 0.0
    pending_txs = db.query(models.Transaction).filter(models.Transaction.fraud_status == "PENDING").count()
    high_risk_txs = db.query(models.Transaction).filter(models.Transaction.risk_score >= 70).all()
    
    # Setup PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # GS Style Colors
    navy_dark = colors.HexColor('#0B132B')
    gold_accent = colors.HexColor('#D4AF37')
    gray_light = colors.HexColor('#F4F5F7')
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=navy_dark,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#5A6A85'),
        spaceAfter=15
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=navy_dark,
        spaceBefore=15,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13
    )

    # Document Header
    story.append(Paragraph("FRAUD VISION - RISK ANALYSIS REPORT", title_style))
    story.append(Paragraph(f"Generated on: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Requested by: {current_user.username} ({current_user.role})", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Summary Cards
    summary_data = [
        [
            Paragraph("<b>Total Transactions Evaluated:</b>", body_style),
            Paragraph(f"{total_txs}", body_style),
            Paragraph("<b>Total Fraud Confirmed:</b>", body_style),
            Paragraph(f"{fraud_txs}", body_style)
        ],
        [
            Paragraph("<b>Pending Reviews:</b>", body_style),
            Paragraph(f"{pending_txs}", body_style),
            Paragraph("<b>Confirmed Fraud Value:</b>", body_style),
            Paragraph(f"${fraud_vol:,.2f}", body_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[150, 100, 150, 100])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), gray_light),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINELEFT', (0,0), (0,-1), 3, navy_dark) # Left border styling
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # High-Risk Flags Table
    story.append(Paragraph("High-Risk Transactions Requiring Immediate Investigation", section_title))
    
    headers = [
        Paragraph("<b>Tx ID</b>", body_style),
        Paragraph("<b>Customer Name</b>", body_style),
        Paragraph("<b>Amount</b>", body_style),
        Paragraph("<b>Risk Score</b>", body_style),
        Paragraph("<b>Country</b>", body_style),
        Paragraph("<b>Status</b>", body_style)
    ]
    table_data = [headers]
    
    # Limit report to top 15 risk items to prevent overflow
    for tx in sorted(high_risk_txs, key=lambda x: x.risk_score, reverse=True)[:15]:
        status_color = "#E53E3E" if tx.fraud_status == "FRAUDULENT" else "#DD6B20" if tx.fraud_status == "PENDING" else "#38A169"
        table_data.append([
            Paragraph(tx.tx_id, body_style),
            Paragraph(tx.customer_name, body_style),
            Paragraph(f"${tx.amount:,.2f}", body_style),
            Paragraph(f"<font color='red'><b>{tx.risk_score}</b></font>" if tx.risk_score >= 80 else f"<b>{tx.risk_score}</b>", body_style),
            Paragraph(tx.country, body_style),
            Paragraph(f"<font color='{status_color}'><b>{tx.fraud_status}</b></font>", body_style)
        ])
        
    risk_table = Table(table_data, colWidths=[70, 130, 80, 70, 80, 80])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy_dark),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, gray_light]),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    # Change first row header text to white
    header_style = ParagraphStyle(
        'HeaderStyle', parent=body_style, textColor=colors.white, fontName='Helvetica-Bold'
    )
    for i in range(len(headers)):
        table_data[0][i] = Paragraph(headers[i].text, header_style)
        
    story.append(risk_table)
    
    # Build Document
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=FraudVision_ExecutiveReport.pdf"}
    )

@router.get("/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    txs = db.query(models.Transaction).all()
    df = pd.DataFrame([
        {
            "Transaction ID": t.tx_id,
            "Customer ID": t.customer_id,
            "Customer Name": t.customer_name,
            "Amount": t.amount,
            "Currency": t.currency,
            "Timestamp": t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "Location": t.location,
            "Country": t.country,
            "Payment Method": t.payment_method,
            "Merchant Category": t.merchant_category,
            "Risk Score": t.risk_score,
            "Fraud Status": t.fraud_status,
            "Suspicious Reasons": t.suspicious_reasons,
            "Investigation Notes": t.notes
        } for t in txs
    ])
    
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(buffer.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=FraudVision_Transactions.csv"}
    )

@router.get("/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    txs = db.query(models.Transaction).all()
    df = pd.DataFrame([
        {
            "Transaction ID": t.tx_id,
            "Customer ID": t.customer_id,
            "Customer Name": t.customer_name,
            "Amount": t.amount,
            "Currency": t.currency,
            "Timestamp": t.timestamp,
            "Location": t.location,
            "Country": t.country,
            "Payment Method": t.payment_method,
            "Merchant Category": t.merchant_category,
            "Risk Score": t.risk_score,
            "Fraud Status": t.fraud_status,
            "Suspicious Reasons": t.suspicious_reasons,
            "Investigation Notes": t.notes
        } for t in txs
    ])
    
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Transactions", index=False)
        
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=FraudVision_Transactions.xlsx"}
    )

@router.get("/schedules", response_model=List[schemas.ScheduledReportResponse])
def get_scheduled_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    schedules = db.query(models.ScheduledReport).all()
    return schedules

@router.post("/schedules", response_model=schemas.ScheduledReportResponse)
def create_scheduled_report(
    report_in: schemas.ScheduledReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Compliance Officer"]))
):
    # Determine next run
    now = datetime.datetime.utcnow()
    if report_in.frequency.upper() == "DAILY":
        next_run = now + datetime.timedelta(days=1)
    else:
        next_run = now + datetime.timedelta(days=7)
        
    schedule = models.ScheduledReport(
        name=report_in.name,
        frequency=report_in.frequency,
        format=report_in.format,
        next_run=next_run,
        email_recipient=report_in.email_recipient,
        active=True
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/schedules/{id}", status_code=204)
def delete_scheduled_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Compliance Officer"]))
):
    schedule = db.query(models.ScheduledReport).filter(models.ScheduledReport.id == id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return None

@router.post("/schedules/{id}/trigger")
def trigger_scheduled_report_mock(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Compliance Officer", "Risk Analyst"]))
):
    schedule = db.query(models.ScheduledReport).filter(models.ScheduledReport.id == id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    # Simulate generation
    schedule.next_run = datetime.datetime.utcnow() + (
        datetime.timedelta(days=1) if schedule.frequency == "DAILY" else datetime.timedelta(days=7)
    )
    db.commit()
    
    return {
        "success": True,
        "message": f"Report '{schedule.name}' compiled and sent to {schedule.email_recipient} via simulated SMTP."
    }
