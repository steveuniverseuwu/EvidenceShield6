# Demo Credentials for EvidenceShield

This document contains all demo login credentials for testing the EvidenceShield system.

## All Demo Users

### 1. Administrator
- **Email:** `admin@evidenceshield.gov`
- **Password:** `admin123`
- **Badge ID:** ADM-001
- **Name:** System Administrator
- **Department:** IT Department
- **Permissions:** Can only manage users (create, edit, deactivate)

---

### 2. Police Officer (John Smith)
- **Email:** `officer@police.gov`
- **Password:** `police123`
- **Badge ID:** P-2345
- **Name:** John Smith
- **Department:** Metropolitan Police
- **Permissions:** Upload files to IPFS, share evidence to Forensics

---

### 3. Forensics Specialist (Dr. Sarah Johnson)
- **Email:** `forensics@lab.gov`
- **Password:** `forensics123`
- **Badge ID:** FS-0791
- **Name:** Dr. Sarah Johnson
- **Department:** Digital Forensics Lab
- **Permissions:** Upload files to IPFS, share evidence to Prosecutors

---

### 4. Prosecutor (Michael Brown)
- **Email:** `prosecutor@da.gov`
- **Password:** `prosecutor123`
- **Badge ID:** DA-8795
- **Name:** Michael Brown
- **Department:** District Attorney Office
- **Permissions:** Verify and download files only

---

### 5. Police Officer/Detective (Emily Davis)
- **Email:** `detective@police.gov`
- **Password:** `detective123`
- **Badge ID:** D-3421
- **Name:** Emily Davis
- **Department:** Metropolitan Police
- **Permissions:** Upload files to IPFS, share evidence to Forensics

---

### 6. Forensics Specialist (Dr. Robert Chen)
- **Email:** `forensics2@lab.gov`
- **Password:** `forensics2123`
- **Badge ID:** FS-1123
- **Name:** Dr. Robert Chen
- **Department:** Digital Forensics Lab
- **Permissions:** Upload files to IPFS, share evidence to Prosecutors

---

### 7. Prosecutor (Jessica Martinez)
- **Email:** `prosecutor2@da.gov`
- **Password:** `prosecutor2123`
- **Badge ID:** DA-9234
- **Name:** Jessica Martinez
- **Department:** District Attorney Office
- **Permissions:** Verify and download files only

---

### 8. Police Officer (David Wilson)
- **Email:** `officer2@police.gov`
- **Password:** `officer2123`
- **Badge ID:** P-5678
- **Name:** David Wilson
- **Department:** Metropolitan Police
- **Permissions:** Upload files to IPFS, share evidence to Forensics

---

## Quick Login Tips

- **For testing User Management:** Login as `admin@evidenceshield.gov`
- **For testing File Upload:** Login as any Police Officer or Forensics Specialist
- **For testing File Sharing:** Login as Police Officer (share to Forensics) or Forensics (share to Prosecutor)
- **For testing File Verification:** Login as any Prosecutor

---

## System Features by Role

| Feature | Admin | Police | Forensics | Prosecutor |
|---------|-------|--------|-----------|------------|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Upload Files | ❌ | ✅ | ✅ | ❌ |
| Share Evidence | ❌ | ✅ (to Forensics) | ✅ (to Prosecutor) | ❌ |
| Verify Files | ❌ | ✅ | ✅ | ✅ |
| Download Files | ❌ | ✅ | ✅ | ✅ |
| View Audit Trail | ✅ | ✅ | ✅ | ✅ |

---

**Note:** All files are stored in the KV database as arrays of numbers. For production, enable real IPFS & Polygon integration by configuring API keys in the backend.
