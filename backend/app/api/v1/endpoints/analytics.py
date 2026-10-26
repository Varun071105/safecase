from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from decimal import Decimal
from typing import List, Optional

from app.db.session import get_db
from app.models.complaint import Complaint
from app.models.evidence import ComplaintEvidence
from app.schemas.analytics import AnalyticsData, StatsSummary, ScamTypeCount, StatusDistribution, TrendPoint
from app.api.deps import require_investigator

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/", response_model=AnalyticsData)
async def get_analytics_data(
    current_user = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    # 1. Total Complaints count
    total_complaints_res = await db.execute(select(func.count(Complaint.id)))
    total_complaints = total_complaints_res.scalar() or 0

    # 2. Active cases (Submitted, Under Review, Investigation Started)
    active_res = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.status.in_(["Submitted", "Under Review", "Investigation Started"]))
    )
    active_cases = active_res.scalar() or 0

    # 3. Resolved cases (Resolved, Closed)
    resolved_res = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.status.in_(["Resolved", "Closed"]))
    )
    resolved_cases = resolved_res.scalar() or 0

    # 4. Evidence files count
    evidence_res = await db.execute(select(func.count(ComplaintEvidence.id)))
    evidence_files = evidence_res.scalar() or 0

    # 5. Total reported loss
    loss_res = await db.execute(select(func.sum(Complaint.amount_lost)))
    total_reported_lost = loss_res.scalar() or Decimal("0.00")

    stats = StatsSummary(
        total_complaints=total_complaints,
        active_cases=active_cases,
        resolved_cases=resolved_cases,
        evidence_files=evidence_files,
        total_reported_lost=total_reported_lost
    )

    # By Scam Type
    scam_type_q = (
        select(
            Complaint.scam_type,
            func.count(Complaint.id).label("count"),
            func.sum(Complaint.amount_lost).label("total_amt")
        )
        .group_by(Complaint.scam_type)
        .order_by(desc("count"))
    )
    scam_type_res = await db.execute(scam_type_q)
    by_scam_type = [
        ScamTypeCount(
            scam_type=row[0],
            count=row[1],
            total_reported_amount=row[2] or Decimal("0.00")
        ) for row in scam_type_res.all()
    ]

    # By Status
    status_q = (
        select(
            Complaint.status,
            func.count(Complaint.id).label("count")
        )
        .group_by(Complaint.status)
    )
    status_res = await db.execute(status_q)
    by_status = [
        StatusDistribution(status=row[0], count=row[1])
        for row in status_res.all()
    ]

    # Timeline / volume trend (recent complaints grouped by date/month)
    # Using python grouping for seamless compatibility between SQLite and Postgres
    all_complaints_res = await db.execute(
        select(Complaint.created_at, Complaint.amount_lost).order_by(Complaint.created_at.asc())
    )
    timeline_dict = {}
    for dt, amt in all_complaints_res.all():
        period_key = dt.strftime("%b %d") if dt else "Recent"
        if period_key not in timeline_dict:
            timeline_dict[period_key] = {"count": 0, "amount": Decimal("0.00")}
        timeline_dict[period_key]["count"] += 1
        timeline_dict[period_key]["amount"] += (amt or Decimal("0.00"))

    timeline = [
        TrendPoint(period=k, count=v["count"], amount=v["amount"])
        for k, v in list(timeline_dict.items())[-12:]
    ]

    return AnalyticsData(
        stats=stats,
        by_scam_type=by_scam_type,
        by_status=by_status,
        timeline=timeline,
        recent_activity_count=total_complaints
    )
