import pytest
import io
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_auth_flows(client):
    # 1. Registration
    reg_resp = await client.post("/api/v1/auth/register", json={
        "email": "new.user@example.com",
        "password": "SecurePassword123#",
        "full_name": "New Citizen",
        "phone_number": "+91 9988776655"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new.user@example.com"
    assert data["user"]["role"] == "CITIZEN"

    # 2. Login with correct credentials
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "new.user@example.com",
        "password": "SecurePassword123#"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # 3. Login with incorrect credentials
    bad_login = await client.post("/api/v1/auth/login", json={
        "email": "new.user@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

@pytest.mark.asyncio
async def test_complaint_and_ownership(client, citizen_token, investigator_token):
    headers = {"Authorization": f"Bearer {citizen_token}"}
    
    # 4. Complaint creation
    payload = {
        "scam_type": "UPI Fraud",
        "amount_lost": "15000.00",
        "incident_date": datetime.now(timezone.utc).isoformat(),
        "scammer_identifier_type": "UPI ID",
        "scammer_identifier": "fraudster@upi",
        "transaction_reference": "UPI/12345",
        "incident_description": "Scammer tricked me into transferring funds via fake electricity bill notice.",
        "incident_location": "New Delhi",
        "consent_given": True
    }
    create_resp = await client.post("/api/v1/complaints/", json=payload, headers=headers)
    assert create_resp.status_code == 201
    comp = create_resp.json()
    assert comp["complaint_number"].startswith("ASC-2026-")
    assert comp["status"] == "Submitted"
    comp_id = comp["id"]

    # 5. Citizen accesses own complaint
    get_resp = await client.get(f"/api/v1/complaints/{comp_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == comp_id

    # 6. Unauthorized user cannot access other's complaint
    other_token_resp = await client.post("/api/v1/auth/register", json={
        "email": "other.user@example.com",
        "password": "SecurePassword123#",
        "full_name": "Other Citizen"
    })
    other_token = other_token_resp.json()["access_token"]
    forbidden_resp = await client.get(f"/api/v1/complaints/{comp_id}", headers={"Authorization": f"Bearer {other_token}"})
    assert forbidden_resp.status_code == 403

    # 7. Investigator can access any complaint
    inv_headers = {"Authorization": f"Bearer {investigator_token}"}
    inv_get = await client.get(f"/api/v1/complaints/{comp_id}", headers=inv_headers)
    assert inv_get.status_code == 200

@pytest.mark.asyncio
async def test_investigator_status_transitions(client, citizen_token, investigator_token):
    # Create complaint as citizen
    headers = {"Authorization": f"Bearer {citizen_token}"}
    create_resp = await client.post("/api/v1/complaints/", json={
        "scam_type": "UPI Fraud",
        "amount_lost": "5000.00",
        "incident_date": datetime.now(timezone.utc).isoformat(),
        "scammer_identifier_type": "Phone number",
        "scammer_identifier": "+91 91234 56789",
        "incident_description": "Fake customer service scam asking for OTP code.",
        "consent_given": True
    }, headers=headers)
    comp_id = create_resp.json()["id"]

    inv_headers = {"Authorization": f"Bearer {investigator_token}"}

    # Citizen cannot change status
    cit_status_update = await client.post(f"/api/v1/complaints/{comp_id}/status", json={
        "new_status": "Investigation Started"
    }, headers=headers)
    assert cit_status_update.status_code == 403

    # Investigator valid transition: Submitted -> Under Review
    status_1 = await client.post(f"/api/v1/complaints/{comp_id}/status", json={
        "new_status": "Under Review",
        "public_remarks": "Case assigned to verification desk.",
        "internal_remarks": "Verified complainant KYC."
    }, headers=inv_headers)
    assert status_1.status_code == 200

    # Next valid transition: Under Review -> Investigation Started
    status_2 = await client.post(f"/api/v1/complaints/{comp_id}/status", json={
        "new_status": "Investigation Started",
        "public_remarks": "Notice issued to telecom authority."
    }, headers=inv_headers)
    assert status_2.status_code == 200

    # Verify status history persistence
    detail_resp = await client.get(f"/api/v1/complaints/{comp_id}", headers=inv_headers)
    history = detail_resp.json()["status_history"]
    assert len(history) >= 3  # Initial + Submitted + Under Review + Investigation Started
    assert any(h["new_status"] == "Under Review" for h in history)

@pytest.mark.asyncio
async def test_evidence_upload_and_download(client, citizen_token, investigator_token):
    headers = {"Authorization": f"Bearer {citizen_token}"}
    create_resp = await client.post("/api/v1/complaints/", json={
        "scam_type": "UPI Fraud",
        "amount_lost": "3000.00",
        "incident_date": datetime.now(timezone.utc).isoformat(),
        "scammer_identifier_type": "UPI ID",
        "scammer_identifier": "scam@paytm",
        "incident_description": "Phishing text message with screenshot attached.",
        "consent_given": True
    }, headers=headers)
    comp_id = create_resp.json()["id"]

    # Valid PNG file bytes
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    
    upload_resp = await client.post(
        f"/api/v1/complaints/{comp_id}/evidence",
        files={"file": ("screenshot.png", io.BytesIO(png_bytes), "image/png")},
        headers=headers
    )
    assert upload_resp.status_code == 201
    ev_data = upload_resp.json()
    evidence_id = ev_data["id"]

    # Secure download by owner
    download_resp = await client.get(
        f"/api/v1/complaints/{comp_id}/evidence/{evidence_id}/download",
        headers=headers
    )
    assert download_resp.status_code == 200
    assert len(download_resp.content) == len(png_bytes)

    # Invalid extension rejected
    bad_upload = await client.post(
        f"/api/v1/complaints/{comp_id}/evidence",
        files={"file": ("malware.exe", io.BytesIO(b"bad content"), "application/x-dosexec")},
        headers=headers
    )
    assert bad_upload.status_code == 400

@pytest.mark.asyncio
async def test_blacklist_and_admin(client, citizen_token, investigator_token, admin_token):
    # Citizen cannot manage blacklist
    cit_post = await client.post("/api/v1/blacklist/", json={
        "identifier_type": "Phone number",
        "identifier_value": "+91 99999 11111",
        "verification_status": "Verified",
        "reason": "Known scammer"
    }, headers={"Authorization": f"Bearer {citizen_token}"})
    assert cit_post.status_code == 403

    # Investigator can add to blacklist
    inv_post = await client.post("/api/v1/blacklist/", json={
        "identifier_type": "Phone number",
        "identifier_value": "+91 99999 11111",
        "verification_status": "Under Review",
        "reason": "Reported in 3 UPI scam complaints."
    }, headers={"Authorization": f"Bearer {investigator_token}"})
    assert inv_post.status_code == 201
    bl_id = inv_post.json()["id"]

    # Super Admin can manage categories
    cat_resp = await client.post("/api/v1/categories/", json={
        "name": "Social Media Extortion",
        "description": "Blackmail via compromised social accounts",
        "display_order": 9,
        "is_active": True
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert cat_resp.status_code == 201

    # Super Admin can view audit logs
    audit_resp = await client.get("/api/v1/audit/", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) > 0

@pytest.mark.asyncio
async def test_analytics_endpoint(client, investigator_token):
    headers = {"Authorization": f"Bearer {investigator_token}"}
    resp = await client.get("/api/v1/analytics/", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "stats" in data
    assert "total_complaints" in data["stats"]
    assert "active_cases" in data["stats"]
    assert "resolved_cases" in data["stats"]
    assert "evidence_files" in data["stats"]
    assert "total_reported_lost" in data["stats"]
    assert "by_scam_type" in data
    assert "by_status" in data
