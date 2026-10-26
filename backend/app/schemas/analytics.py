from pydantic import BaseModel
from decimal import Decimal
from typing import List, Dict, Any

class StatsSummary(BaseModel):
    total_complaints: int
    active_cases: int
    resolved_cases: int
    evidence_files: int
    total_reported_lost: Decimal  # Clearly documented as reported amount lost

class ScamTypeCount(BaseModel):
    scam_type: str
    count: int
    total_reported_amount: Decimal

class StatusDistribution(BaseModel):
    status: str
    count: int

class TrendPoint(BaseModel):
    period: str  # e.g., '2026-10' or date
    count: int
    amount: Decimal

class AnalyticsData(BaseModel):
    stats: StatsSummary
    by_scam_type: List[ScamTypeCount]
    by_status: List[StatusDistribution]
    timeline: List[TrendPoint]
    recent_activity_count: int
