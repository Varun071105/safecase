import secrets
from typing import List, Optional
from datetime import datetime, timezone
import io
import csv
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.evidence import ComplaintEvidence
from app.models.status_history import ComplaintStatusHistory
from app.models.note import InvestigationNote
from app.models.notification import Notification
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintDetailResponse,
    StatusUpdateRequest,
    AssignmentUpdateRequest
)
from app.schemas.evidence import EvidenceResponse
from app.schemas.status_history import StatusHistoryResponse
from app.schemas.note import NoteCreate, NoteResponse
from app.api.deps import get_current_user, require_investigator
from app.services.email import email_service
from app.services.audit import log_action

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def generate_complaint_number() -> str:
    random_hex = secrets.token_hex(4).upper()
    return f"ASC-2026-{random_hex}"

ALLOWED_TRANSITIONS = {
    "Submitted": ["Under Review"],
    "Under Review": ["Investigation Started", "Closed"],
    "Investigation Started": ["Resolved", "Under Review", "Closed"],
    "Resolved": ["Closed", "Under Review"],
    "Closed": ["Under Review"]  # Reopen if new evidence surfaces
}

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Ensure complaint number is unique
    while True:
        comp_number = generate_complaint_number()
        exists = await db.execute(select(Complaint).where(Complaint.complaint_number == comp_number))
        if not exists.scalars().first():
            break

    complaint = Complaint(
        complaint_number=comp_number,
        user_id=current_user.id,
        scam_type=data.scam_type,
        amount_lost=data.amount_lost,
        incident_date=data.incident_date,
        scammer_identifier_type=data.scammer_identifier_type,
        scammer_identifier=data.scammer_identifier.strip(),
        transaction_reference=data.transaction_reference.strip() if data.transaction_reference else None,
        incident_description=data.incident_description.strip(),
        incident_location=data.incident_location.strip() if data.incident_location else None,
        consent_given=data.consent_given,
        status="Submitted",
        priority="Medium"
    )
    db.add(complaint)
    await db.flush()

    # Create initial status history entry
    status_entry = ComplaintStatusHistory(
        complaint_id=complaint.id,
        actor_id=current_user.id,
        previous_status="Initial",
        new_status="Submitted",
        public_remarks="Complaint filed and received by the portal.",
        internal_remarks=None
    )
    db.add(status_entry)

    # In-app notification for the user
    notification = Notification(
        user_id=current_user.id,
        title="Complaint Submitted",
        message=f"Your complaint ({comp_number}) has been registered and queued for review.",
        link=f"/dashboard/complaints/{complaint.id}"
    )
    db.add(notification)

    # Audit log
    await log_action(
        db=db,
        action="COMPLAINT_CREATED",
        target_type="Complaint",
        target_id=complaint.id,
        actor_id=current_user.id,
        details=f"Complaint {comp_number} filed for {data.scam_type} (Loss: INR {data.amount_lost})"
    )

    await db.commit()
    await db.refresh(complaint)

    # Email notification (handles dev mode log or SMTP)
    email_service.notify_complaint_submitted(
        recipient_email=current_user.email,
        complaint_number=comp_number,
        complainant_name=current_user.full_name
    )

    return ComplaintResponse(
        id=complaint.id,
        complaint_number=complaint.complaint_number,
        user_id=complaint.user_id,
        scam_type=complaint.scam_type,
        amount_lost=complaint.amount_lost,
        incident_date=complaint.incident_date,
        scammer_identifier_type=complaint.scammer_identifier_type,
        scammer_identifier=complaint.scammer_identifier,
        transaction_reference=complaint.transaction_reference,
        incident_description=complaint.incident_description,
        incident_location=complaint.incident_location,
        consent_given=complaint.consent_given,
        status=complaint.status,
        priority=complaint.priority,
        assigned_investigator_id=complaint.assigned_investigator_id,
        resolution_summary=complaint.resolution_summary,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        complainant_name=current_user.full_name,
        complainant_email=current_user.email,
        evidence_count=0
    )

@router.get("/")
async def list_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    scam_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_to_me: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Complaint).options(
        selectinload(Complaint.complainant),
        selectinload(Complaint.assigned_investigator),
        selectinload(Complaint.evidence)
    )

    # Role-based restriction: citizens only see their own
    if current_user.role == "CITIZEN":
        query = query.where(Complaint.user_id == current_user.id)
    else:
        # Investigator/Admin filters
        if assigned_to_me and current_user.role in ("INVESTIGATOR", "ADMIN"):
            query = query.where(Complaint.assigned_investigator_id == current_user.id)

    if scam_type:
        query = query.where(Complaint.scam_type == scam_type)
    if status_filter:
        query = query.where(Complaint.status == status_filter)
    if search:
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                Complaint.complaint_number.ilike(s),
                Complaint.scammer_identifier.ilike(s),
                Complaint.incident_description.ilike(s)
            )
        )

    # Count total matching
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    # Pagination & sorting (newest first)
    query = query.order_by(desc(Complaint.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    complaints = result.scalars().all()

    items = []
    for c in complaints:
        items.append(
            ComplaintResponse(
                id=c.id,
                complaint_number=c.complaint_number,
                user_id=c.user_id,
                scam_type=c.scam_type,
                amount_lost=c.amount_lost,
                incident_date=c.incident_date,
                scammer_identifier_type=c.scammer_identifier_type,
                scammer_identifier=c.scammer_identifier,
                transaction_reference=c.transaction_reference,
                incident_description=c.incident_description,
                incident_location=c.incident_location,
                consent_given=c.consent_given,
                status=c.status,
                priority=c.priority,
                assigned_investigator_id=c.assigned_investigator_id,
                resolution_summary=c.resolution_summary,
                created_at=c.created_at,
                updated_at=c.updated_at,
                complainant_name=c.complainant.full_name if c.complainant else None,
                complainant_email=c.complainant.email if c.complainant else None,
                assigned_investigator_name=c.assigned_investigator.full_name if c.assigned_investigator else None,
                evidence_count=len(c.evidence)
            )
        )

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1
    }

@router.get("/export/csv")
async def export_complaints_csv(
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    query = select(Complaint).options(
        selectinload(Complaint.complainant),
        selectinload(Complaint.assigned_investigator)
    ).order_by(desc(Complaint.created_at))
    
    result = await db.execute(query)
    complaints = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Complaint ID", "Date Filed", "Scam Type", "Reported Amount Lost (INR)",
        "Identifier Type", "Identifier Value", "Status", "Priority",
        "Assigned Investigator", "Complainant Name"
    ])

    for c in complaints:
        writer.writerow([
            c.complaint_number,
            c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            c.scam_type,
            str(c.amount_lost),
            c.scammer_identifier_type,
            c.scammer_identifier,
            c.status,
            c.priority,
            c.assigned_investigator.full_name if c.assigned_investigator else "Unassigned",
            c.complainant.full_name if c.complainant else "Unknown"
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=safecase_complaints_export.csv"}
    )
    return response

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
async def get_complaint_detail(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Complaint).options(
        selectinload(Complaint.complainant),
        selectinload(Complaint.assigned_investigator),
        selectinload(Complaint.evidence).selectinload(ComplaintEvidence.uploader),
        selectinload(Complaint.status_history).selectinload(ComplaintStatusHistory.actor),
        selectinload(Complaint.notes).selectinload(InvestigationNote.author)
    ).where(Complaint.id == complaint_id)

    result = await db.execute(query)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Access check
    if current_user.role == "CITIZEN" and c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this complaint casework")

    # Format evidence
    evidence_list = [
        EvidenceResponse(
            id=e.id,
            complaint_id=e.complaint_id,
            uploaded_by_id=e.uploaded_by_id,
            filename=e.filename,
            file_size=e.file_size,
            content_type=e.content_type,
            created_at=e.created_at,
            uploader_name=e.uploader.full_name if e.uploader else None
        ) for e in c.evidence
    ]

    # Format status history: hide internal remarks for citizen
    history_list = []
    for h in c.status_history:
        history_list.append(
            StatusHistoryResponse(
                id=h.id,
                complaint_id=h.complaint_id,
                actor_id=h.actor_id,
                previous_status=h.previous_status,
                new_status=h.new_status,
                public_remarks=h.public_remarks,
                internal_remarks=h.internal_remarks if current_user.role in ("INVESTIGATOR", "ADMIN") else None,
                created_at=h.created_at,
                actor_name=h.actor.full_name if h.actor else "System Desk",
                actor_role=h.actor.role if h.actor else "System"
            )
        )

    # Format notes: if citizen, only show public notes (is_internal == False)
    notes_list = []
    for n in c.notes:
        if current_user.role == "CITIZEN" and n.is_internal:
            continue
        notes_list.append(
            NoteResponse(
                id=n.id,
                complaint_id=n.complaint_id,
                author_id=n.author_id,
                content=n.content,
                is_internal=n.is_internal,
                created_at=n.created_at,
                author_name=n.author.full_name if n.author else "Investigator",
                author_role=n.author.role if n.author else "Officer"
            )
        )

    return ComplaintDetailResponse(
        id=c.id,
        complaint_number=c.complaint_number,
        user_id=c.user_id,
        scam_type=c.scam_type,
        amount_lost=c.amount_lost,
        incident_date=c.incident_date,
        scammer_identifier_type=c.scammer_identifier_type,
        scammer_identifier=c.scammer_identifier,
        transaction_reference=c.transaction_reference,
        incident_description=c.incident_description,
        incident_location=c.incident_location,
        consent_given=c.consent_given,
        status=c.status,
        priority=c.priority,
        assigned_investigator_id=c.assigned_investigator_id,
        resolution_summary=c.resolution_summary,
        created_at=c.created_at,
        updated_at=c.updated_at,
        complainant_name=c.complainant.full_name if c.complainant else None,
        complainant_email=c.complainant.email if c.complainant else None,
        assigned_investigator_name=c.assigned_investigator.full_name if c.assigned_investigator else None,
        evidence_count=len(c.evidence),
        evidence=evidence_list,
        status_history=history_list,
        notes=notes_list
    )

@router.post("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    data: StatusUpdateRequest,
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    query = select(Complaint).options(selectinload(Complaint.complainant)).where(Complaint.id == complaint_id)
    result = await db.execute(query)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = c.status
    target_status = data.new_status

    # Validate transition
    valid_next = ALLOWED_TRANSITIONS.get(old_status, [])
    if target_status != old_status and target_status not in valid_next and target_status != "Under Review":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from '{old_status}' to '{target_status}'. Allowed: {', '.join(valid_next)}"
        )

    c.status = target_status
    if data.resolution_summary:
        c.resolution_summary = data.resolution_summary

    # Insert status history record
    history = ComplaintStatusHistory(
        complaint_id=c.id,
        actor_id=current_user.id,
        previous_status=old_status,
        new_status=target_status,
        public_remarks=data.public_remarks,
        internal_remarks=data.internal_remarks
    )
    db.add(history)

    # In-app notification to complainant
    notif = Notification(
        user_id=c.user_id,
        title=f"Case Status Updated: {target_status}",
        message=f"Case {c.complaint_number} updated to '{target_status}'." + (f" Note: {data.public_remarks}" if data.public_remarks else ""),
        link=f"/dashboard/complaints/{c.id}"
    )
    db.add(notif)

    # Audit log
    await log_action(
        db=db,
        action="COMPLAINT_STATUS_CHANGE",
        target_type="Complaint",
        target_id=c.id,
        actor_id=current_user.id,
        details=f"Status changed from '{old_status}' to '{target_status}'"
    )

    await db.commit()

    # Send email notification
    if c.complainant:
        email_service.notify_status_change(
            recipient_email=c.complainant.email,
            complaint_number=c.complaint_number,
            complainant_name=c.complainant.full_name,
            old_status=old_status,
            new_status=target_status,
            public_remarks=data.public_remarks
        )

    return {"message": "Status updated successfully", "status": target_status}

@router.post("/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    data: AssignmentUpdateRequest,
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    c = (await db.execute(select(Complaint).where(Complaint.id == complaint_id))).scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if data.assigned_investigator_id is not None:
        if data.assigned_investigator_id != "":
            # Check investigator exists and has role
            inv = (await db.execute(select(User).where(User.id == data.assigned_investigator_id))).scalars().first()
            if not inv or inv.role not in ("INVESTIGATOR", "ADMIN"):
                raise HTTPException(status_code=400, detail="Assigned user must be an active Investigator or Admin")
            c.assigned_investigator_id = inv.id

            # Notify the assigned investigator
            db.add(Notification(
                user_id=inv.id,
                title="New Case Assignment",
                message=f"You have been assigned to case {c.complaint_number} ({c.scam_type}).",
                link=f"/investigation/complaints/{c.id}"
            ))
        else:
            c.assigned_investigator_id = None

    if data.priority:
        c.priority = data.priority

    await log_action(
        db=db,
        action="COMPLAINT_ASSIGNMENT_UPDATE",
        target_type="Complaint",
        target_id=c.id,
        actor_id=current_user.id,
        details=f"Assigned investigator: {c.assigned_investigator_id}, Priority: {c.priority}"
    )

    await db.commit()
    return {"message": "Assignment and priority updated successfully"}

@router.post("/{complaint_id}/notes")
async def add_investigation_note(
    complaint_id: str,
    data: NoteCreate,
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    c = (await db.execute(select(Complaint).where(Complaint.id == complaint_id))).scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    note = InvestigationNote(
        complaint_id=c.id,
        author_id=current_user.id,
        content=data.content.strip(),
        is_internal=data.is_internal
    )
    db.add(note)

    # If public remark, notify citizen
    if not data.is_internal:
        db.add(Notification(
            user_id=c.user_id,
            title="Investigator Remark Added",
            message=f"An official update was posted on your case {c.complaint_number}.",
            link=f"/dashboard/complaints/{c.id}"
        ))

    await log_action(
        db=db,
        action="INVESTIGATION_NOTE_ADDED",
        target_type="Complaint",
        target_id=c.id,
        actor_id=current_user.id,
        details=f"Added {'internal' if data.is_internal else 'public'} note"
    )

    await db.commit()
    await db.refresh(note)

    return {
        "id": note.id,
        "content": note.content,
        "is_internal": note.is_internal,
        "created_at": note.created_at,
        "author_name": current_user.full_name
    }
