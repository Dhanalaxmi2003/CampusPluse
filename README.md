## Approach

CampusPulse is designed as an end-to-end college attendance management system rather than only an attendance marking application.

The system follows the workflow:

**Create Session → Record Attendance → Validate → Submit → Lock → Calculate → Review → Correct → Audit → Report**

The main approach is:

1. **Role-based workflow**

   * Faculty manages attendance sessions and records attendance.
   * HOD reviews attendance correction requests and monitors department attendance.
   * Admin monitors institution-level attendance and compliance.
   * Students view their attendance and low-attendance information.

2. **Attendance session management**

   * Faculty selects the subject and section.
   * A session is created for a particular class.
   * Students are marked as Present, Absent, Late, or Excused.
   * Attendance is validated before submission.
   * Once submitted, the session can be locked to prevent unauthorized changes.

3. **Attendance calculation**
   Attendance percentage is calculated from actual attendance records:

   **Attendance % = (Attended Classes / Total Classes) × 100**

   This avoids manually modifying percentages and keeps the calculation consistent with the underlying records.

4. **Correction workflow**

   * Faculty can request a correction when an attendance record is incorrect.
   * A reason is required.
   * HOD reviews the request.
   * Approved corrections update the relevant attendance record.
   * The attendance percentage is recalculated after the correction.

5. **Low-attendance monitoring**

   * Students below the configured 75% threshold are identified.
   * The system provides information about the number of classes required to reach the threshold.

6. **Audit and reporting**
   Important attendance activities are tracked through audit information so that changes can be reviewed later.

---

## Assumptions

The following assumptions are used for the CampusPulse prototype:

1. The institution has approximately **5,000 students and 200 faculty members**.
2. Students are organized by department, course, semester, and section.
3. Faculty members are assigned to specific subjects and class schedules.
4. The default minimum attendance requirement is **75%**.
5. An attendance session represents one scheduled class.
6. A student can have only one attendance record for a particular attendance session.
7. Attendance statuses include:

   * Present
   * Absent
   * Late
   * Excused
8. Attendance corrections require a valid reason.
9. Correction requests are reviewed by an authorized HOD/Admin user.
10. Locked attendance sessions should not normally be modified.
11. Attendance percentage is calculated from actual attendance records.
12. The prototype uses sample JavaScript data instead of a production database.
13. QR attendance is simulated in the prototype.
14. Role selection is simulated in the frontend; production authentication would be handled by a backend.
15. Email/SMS notifications are represented as future production functionality.

---

## Architecture

CampusPulse follows a modular attendance-management architecture.

### High-Level Architecture

```text
                 CampusPulse
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     Faculty         HOD          Admin
        │             │             │
        └─────────────┼─────────────┘
                      │
                   Student
                      │
                      ▼
              Attendance System
                      │
       ┌──────────────┼──────────────┐
       │              │              │
 Attendance       Correction      Reporting
  Sessions         Workflow        & Audit
       │              │              │
       └──────────────┼──────────────┘
                      │
                      ▼
                Data Layer
```

### Attendance Data Flow

```text
Department
     ↓
Course
     ↓
Course Section
     ↓
Subject
     ↓
Class Schedule
     ↓
Attendance Session
     ↓
Attendance Record
     ↓
Correction Request
     ↓
Audit Log
```

### Main Entities

**User**

Stores user identity, role, and department information.

**Department**

Represents an academic department.

**Course / Section**

Represents the academic course and student section.

**Subject**

Represents an individual subject taught to a section.

**Class Schedule**

Connects faculty, subject, section, classroom, and scheduled time.

**Attendance Session**

Represents one attendance event for a particular class.

**Attendance Record**

Stores the attendance status of an individual student for an attendance session.

**Correction Request**

Stores requests to modify an attendance record, including the reason and approval status.

**Audit Log**

Stores important actions performed by users.

### Production Architecture

The current project is a frontend prototype. A production version can follow:

```text
Frontend
HTML / CSS / JavaScript
        │
        ▼
REST API
        │
        ▼
Backend Application
        │
        ▼
MySQL / PostgreSQL
        │
        ├── Authentication
        ├── Role-Based Access Control
        ├── Attendance Service
        ├── Correction Service
        ├── Reporting
        └── Audit Logging
```

---

## Trade-offs

### 1. Frontend Prototype vs Full Backend

**Decision:**
The current implementation uses HTML, CSS, JavaScript, and sample data.

**Reason:**
The assignment focuses on demonstrating the attendance workflow, business logic, user roles, validation, and system design.

**Trade-off:**
Data is not permanently stored in a production database.

---

### 2. Simulated QR Scanner vs Real QR Scanner

**Decision:**
QR attendance is simulated in the prototype.

**Reason:**
This demonstrates the intended QR attendance workflow without requiring camera hardware or an external scanning service.

**Trade-off:**
It does not perform real QR-code recognition or identity verification.

---

### 3. Simulated Role Selection vs Real Authentication

**Decision:**
The prototype allows switching between Faculty, HOD, Admin, and Student views.

**Reason:**
It makes it easy for evaluators to test the different workflows.

**Trade-off:**
This is not a security mechanism. A production system must enforce authentication and authorization on the backend.

---

### 4. JavaScript Sample Data vs Database

**Decision:**
Sample data is maintained in JavaScript files.

**Reason:**
It keeps the prototype simple and easy to run without database configuration.

**Trade-off:**
Changes are not persisted like they would be in a MySQL/PostgreSQL database.

---

### 5. Derived Attendance Percentage vs Stored Percentage

**Decision:**
Attendance percentage should be derived from attendance records.

**Reason:**
It prevents inconsistencies when attendance is corrected.

**Trade-off:**
Calculations may require database queries or aggregation in a production system, but this provides better data consistency.

---

### 6. Prototype Simplicity vs Production Scalability

**Decision:**
The prototype focuses on demonstrating the core business workflow.

**Reason:**
A complete production system for 5,000+ students would require backend services, database optimization, authentication, monitoring, and notification infrastructure.

**Trade-off:**
Some production concerns are represented architecturally rather than fully implemented in the frontend prototype.


**Live Demo:**

https://dhanalaxmi2003.github.io/CampusPluse/

>

---
