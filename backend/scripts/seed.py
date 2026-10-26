import asyncio
import os
import sys
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import ScamCategory
from app.models.complaint import Complaint
from app.models.evidence import ComplaintEvidence
from app.models.status_history import ComplaintStatusHistory
from app.models.note import InvestigationNote
from app.models.blacklist import BlacklistEntry
from app.models.notification import Notification
from app.models.audit_log import AuditLog

async def seed_database():
    print("Connecting to database and setting up schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        admin_check = await db.execute(select(User).where(User.email == "admin@safecase.gov"))
        if admin_check.scalars().first():
            print("Database already contains seed data. Skipping to prevent duplicate seeding.")
            return

        print("Seeding default categories...")
        categories = [
            ("UPI Fraud", "Fraudulent UPI transfers, QR scams, fake collect requests, refund imposters", 1),
            ("Phishing", "Deceptive emails, fake banking portals, credential harvest links", 2),
            ("Online Shopping Fraud", "Counterfeit ecommerce websites, undelivered merchandise, clone stores", 3),
            ("Job or Employment Fraud", "Fake offer letters, advance training fee demands, part-time task scams", 4),
            ("Investment Fraud", "Ponzi schemes, fake crypto trading platforms, guarantee profit scams", 5),
            ("Impersonation", "Government officer, police, utility provider, or executive impersonation", 6),
            ("Loan or Credit Fraud", "Instant loan apps harassment, unauthorized fee deductions, blackmail", 7),
            ("Other", "Miscellaneous cyber fraud, extortion, or extortion schemes", 8),
        ]
        for name, desc, order in categories:
            db.add(ScamCategory(name=name, description=desc, display_order=order, is_active=True))

        print("Seeding demo users...")
        admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "AdminSafecase#2026")
        investigator_pass = os.getenv("SEED_INVESTIGATOR_PASSWORD", "Investigator#2026")
        citizen_pass = os.getenv("SEED_CITIZEN_PASSWORD", "CitizenPass#2026")

        admin_user = User(
            email="admin@safecase.gov",
            hashed_password=get_password_hash(admin_pass),
            full_name="Superintendent K. Rao",
            phone_number="+91 91234 56789",
            role="ADMIN",
            is_active=True
        )
        investigator_user = User(
            email="officer.sharma@safecase.gov",
            hashed_password=get_password_hash(investigator_pass),
            full_name="Officer Vikram Sharma",
            phone_number="+91 98765 01234",
            role="INVESTIGATOR",
            is_active=True
        )
        citizen_user = User(
            email="citizen.varun@example.com",
            hashed_password=get_password_hash(citizen_pass),
            full_name="Varun Prithviraj",
            phone_number="+91 94567 89012",
            role="CITIZEN",
            is_active=True
        )

        db.add_all([admin_user, investigator_user, citizen_user])
        await db.flush()

        print("Seeding realistic sample complaints...")
        now = datetime.now(timezone.utc)

        c1 = Complaint(
            complaint_number="ASC-2026-9B41F20E",
            user_id=citizen_user.id,
            scam_type="UPI Fraud",
            amount_lost=Decimal("45000.00"),
            incident_date=now - timedelta(days=3),
            scammer_identifier_type="UPI ID",
            scammer_identifier="refund.desk.hdfc@okaxis",
            transaction_reference="UPI/20261022/9483920194",
            incident_description="Received a call impersonating bank customer support claiming an erroneous auto-debit of insurance premium. Induced to approve collect request on UPI app under the guise of reversing the debit.",
            incident_location="New Delhi, India",
            consent_given=True,
            status="Investigation Started",
            priority="High",
            assigned_investigator_id=investigator_user.id,
            created_at=now - timedelta(days=3)
        )
        db.add(c1)
        await db.flush()

        db.add(ComplaintStatusHistory(
            complaint_id=c1.id,
            actor_id=citizen_user.id,
            previous_status="Initial",
            new_status="Submitted",
            public_remarks="Complaint filed via public safety portal.",
            created_at=now - timedelta(days=3)
        ))
        db.add(ComplaintStatusHistory(
            complaint_id=c1.id,
            actor_id=investigator_user.id,
            previous_status="Submitted",
            new_status="Under Review",
            public_remarks="Case assigned to Cyber Crime Casework Cell.",
            internal_remarks="Initial triage verified valid bank statement snippet. Requisition to NPCI drafted.",
            created_at=now - timedelta(days=2)
        ))
        db.add(ComplaintStatusHistory(
            complaint_id=c1.id,
            actor_id=investigator_user.id,
            previous_status="Under Review",
            new_status="Investigation Started",
            public_remarks="Formal notice dispatched to intermediary payment service provider.",
            internal_remarks="Account freeze order sent to beneficiary bank under Sec 91 CrPC.",
            created_at=now - timedelta(days=1)
        ))
        db.add(InvestigationNote(
            complaint_id=c1.id,
            author_id=investigator_user.id,
            content="Intermediary bank nodal officer reached; beneficiary virtual payment address marked for surveillance.",
            is_internal=True,
            created_at=now - timedelta(days=1)
        ))
        db.add(InvestigationNote(
            complaint_id=c1.id,
            author_id=investigator_user.id,
            content="Your case is actively being processed with the respective banking authority.",
            is_internal=False,
            created_at=now - timedelta(hours=12)
        ))

        # Sample Complaint 2: Job Fraud
        c2 = Complaint(
            complaint_number="ASC-2026-3A18CE4D",
            user_id=citizen_user.id,
            scam_type="Job or Employment Fraud",
            amount_lost=Decimal("120000.00"),
            incident_date=now - timedelta(days=7),
            scammer_identifier_type="Phone number",
            scammer_identifier="+91 98765 43210",
            transaction_reference="IMPS/6102938472",
            incident_description="Offered remote data evaluation role with promised daily payout. Asked to deposit security bond and equipment fee before dispatching laptop. Scammer stopped replying upon payment.",
            incident_location="Bengaluru, India",
            consent_given=True,
            status="Under Review",
            priority="Medium",
            assigned_investigator_id=investigator_user.id,
            created_at=now - timedelta(days=7)
        )
        db.add(c2)
        await db.flush()

        db.add(ComplaintStatusHistory(
            complaint_id=c2.id,
            actor_id=citizen_user.id,
            previous_status="Initial",
            new_status="Submitted",
            public_remarks="Complaint filed.",
            created_at=now - timedelta(days=7)
        ))
        db.add(ComplaintStatusHistory(
            complaint_id=c2.id,
            actor_id=investigator_user.id,
            previous_status="Submitted",
            new_status="Under Review",
            public_remarks="Preliminary analysis in progress.",
            internal_remarks="Phone number CDR analysis request submitted to telecom operator.",
            created_at=now - timedelta(days=5)
        ))

        # Sample Complaint 3: Online Shopping Fraud (Resolved)
        c3 = Complaint(
            complaint_number="ASC-2026-F7A9213C",
            user_id=citizen_user.id,
            scam_type="Online Shopping Fraud",
            amount_lost=Decimal("14999.00"),
            incident_date=now - timedelta(days=14),
            scammer_identifier_type="Website URL",
            scammer_identifier="https://deals-festive-clearance.shop",
            transaction_reference="CC/AUTH/8839201",
            incident_description="Fake promotional storefront mimicking authentic brand. Paid for electronics goods that never arrived. Support emails bounced.",
            incident_location="Mumbai, India",
            consent_given=True,
            status="Resolved",
            priority="Low",
            assigned_investigator_id=investigator_user.id,
            resolution_summary="Payment gateway aggregator frozen disputed merchant wallet. Full chargeback successfully credited to complainant's issuing bank.",
            created_at=now - timedelta(days=14)
        )
        db.add(c3)
        await db.flush()

        db.add(ComplaintStatusHistory(
            complaint_id=c3.id,
            actor_id=investigator_user.id,
            previous_status="Investigation Started",
            new_status="Resolved",
            public_remarks="Chargeback confirmed and merchant gateway account terminated.",
            internal_remarks="Nodal report confirmed 100% funds recovery for complainant.",
            created_at=now - timedelta(days=2)
        ))

        # Sample Complaint 4: Phishing
        c4 = Complaint(
            complaint_number="ASC-2026-5C04891A",
            user_id=citizen_user.id,
            scam_type="Phishing",
            amount_lost=Decimal("78500.00"),
            incident_date=now - timedelta(hours=18),
            scammer_identifier_type="Website URL",
            scammer_identifier="https://secure-kyc-verify-net.info",
            transaction_reference="NEFT/N1029381029",
            incident_description="SMS received stating SIM card would be blocked without immediate KYC completion. Clicked link to spoofed portal where debit card credentials and OTP were intercepted.",
            incident_location="Hyderabad, India",
            consent_given=True,
            status="Submitted",
            priority="Critical",
            created_at=now - timedelta(hours=18)
        )
        db.add(c4)

        # Sample Complaint 5: Investment Fraud
        c5 = Complaint(
            complaint_number="ASC-2026-2D85EA71",
            user_id=citizen_user.id,
            scam_type="Investment Fraud",
            amount_lost=Decimal("350000.00"),
            incident_date=now - timedelta(days=10),
            scammer_identifier_type="Social media account",
            scammer_identifier="@telegram_crypto_signals_vip",
            transaction_reference="TXID/0x93f8291a938e",
            incident_description="Joined investment advisory group guaranteeing 20% weekly returns. Platform showed fake trading balances; demanded additional 15% clearance fee when withdrawal was requested.",
            incident_location="Delhi NCR",
            consent_given=True,
            status="Investigation Started",
            priority="High",
            assigned_investigator_id=admin_user.id,
            created_at=now - timedelta(days=10)
        )
        db.add(c5)

        print("Seeding verified and under-review blacklist entries...")
        db.add(BlacklistEntry(
            identifier_type="UPI ID",
            identifier_value="refund.desk.hdfc@okaxis",
            verification_status="Verified",
            reason="Confirmed fraudulent VPA used in unauthorized account takeover and social engineering fraud.",
            related_complaint_id=c1.id,
            created_by_id=investigator_user.id
        ))
        db.add(BlacklistEntry(
            identifier_type="Website URL",
            identifier_value="https://secure-kyc-verify-net.info",
            verification_status="Verified",
            reason="Credential phishing site clone targeting bank credentials and one-time passwords.",
            related_complaint_id=None,
            created_by_id=admin_user.id
        ))
        db.add(BlacklistEntry(
            identifier_type="Phone number",
            identifier_value="+91 98765 43210",
            verification_status="Under Review",
            reason="Multiple complaints registered for employment guarantee fee extortion.",
            related_complaint_id=c2.id,
            created_by_id=investigator_user.id
        ))

        print("Seeding sample notifications...")
        db.add(Notification(
            user_id=citizen_user.id,
            title="Case Status Updated",
            message="Your case ASC-2026-9B41F20E has transitioned to 'Investigation Started'.",
            link=f"/dashboard/complaints/{c1.id}",
            is_read=False,
            created_at=now - timedelta(hours=5)
        ))
        db.add(Notification(
            user_id=investigator_user.id,
            title="New Assignment",
            message="You have been assigned to Case ASC-2026-9B41F20E (UPI Fraud).",
            link=f"/investigation/complaints/{c1.id}",
            is_read=True,
            created_at=now - timedelta(days=2)
        ))

        print("Seeding audit logs...")
        db.add(AuditLog(
            actor_id=admin_user.id,
            action="SYSTEM_INIT",
            target_type="System",
            details="System seed completed with initial roles and verified scam categories."
        ))

        await db.commit()
        print("\n=== SAFECASE SEED COMPLETED SUCCESSFULLY ===")
        print("Demo Accounts Created:")
        print(f"  1. Super Admin:   admin@safecase.gov           / {admin_pass}")
        print(f"  2. Investigator:  officer.sharma@safecase.gov  / {investigator_pass}")
        print(f"  3. Public Citizen: citizen.varun@example.com   / {citizen_pass}")
        print("============================================\n")

if __name__ == "__main__":
    asyncio.run(seed_database())
