from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path

from app.db.session import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.evidence import ComplaintEvidence
from app.schemas.evidence import EvidenceResponse
from app.api.deps import get_current_user
from app.services.storage import storage_service
from app.services.audit import log_action

router = APIRouter(prefix="/complaints", tags=["Evidence"])

@router.post("/{complaint_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    complaint_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    c = (await db.execute(select(Complaint).where(Complaint.id == complaint_id))).scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Authorization
    if current_user.role == "CITIZEN":
        if c.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized to upload evidence to this complaint")
        if c.status in ("Resolved", "Closed"):
            raise HTTPException(status_code=400, detail="Cannot upload supplementary evidence to a closed or resolved complaint")

    # Save file via storage service
    orig_name, storage_path, file_size, content_type, sha256_hash = await storage_service.save_file(file)

    evidence = ComplaintEvidence(
        complaint_id=c.id,
        uploaded_by_id=current_user.id,
        filename=orig_name,
        storage_path=storage_path,
        file_size=file_size,
        content_type=content_type,
        file_hash=sha256_hash
    )
    db.add(evidence)

    await log_action(
        db=db,
        action="EVIDENCE_UPLOADED",
        target_type="ComplaintEvidence",
        target_id=evidence.id,
        actor_id=current_user.id,
        details=f"Uploaded evidence '{orig_name}' ({file_size} bytes, SHA256: {sha256_hash[:12]}...)"
    )

    await db.commit()
    await db.refresh(evidence)

    return EvidenceResponse(
        id=evidence.id,
        complaint_id=evidence.complaint_id,
        uploaded_by_id=evidence.uploaded_by_id,
        filename=evidence.filename,
        file_size=evidence.file_size,
        content_type=evidence.content_type,
        created_at=evidence.created_at,
        uploader_name=current_user.full_name
    )

@router.get("/{complaint_id}/evidence/{evidence_id}/download")
async def download_evidence(
    complaint_id: str,
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    c = (await db.execute(select(Complaint).where(Complaint.id == complaint_id))).scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Authorization check
    if current_user.role == "CITIZEN" and c.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to access evidence for this complaint")

    ev = (await db.execute(select(ComplaintEvidence).where(
        ComplaintEvidence.id == evidence_id,
        ComplaintEvidence.complaint_id == complaint_id
    ))).scalars().first()

    if not ev:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    file_path = storage_service.get_file_path(ev.storage_path)

    return FileResponse(
        path=file_path,
        media_type=ev.content_type,
        filename=ev.filename
    )
