from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas, auth
from backend.database import get_db
from backend.websocket_manager import manager

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notifications = db.query(models.Notification).order_by(models.Notification.timestamp.desc()).limit(100).all()
    return notifications

@router.put("/{id}/read", response_model=schemas.NotificationResponse)
def mark_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notif = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db.query(models.Notification).filter(models.Notification.is_read == False).update({models.Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"success": True}

# WebSocket route for real-time push streams
# Note: In FastAPI, websocket routes in sub-routers are supported, but we must use websocket schema
@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We listen for messages, though it's mostly a one-way broadcast from server to client
            data = await websocket.receive_text()
            # Echo or heartbeat
            await websocket.send_json({"type": "HEARTBEAT", "status": "OK"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)
