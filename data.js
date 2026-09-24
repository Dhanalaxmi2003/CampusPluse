// CampusPulse - Enterprise College Attendance System Data Engine
// Simulates data for 5,000 Students, 200 Faculty, 5 Departments, Classes, Sections & Subjects

const CampusData = (() => {
  // Institutional Meta
  const institution = {
    name: "St. John's Institute of Technology & Engineering",
    code: "SJITE",
    totalStudents: 5120,
    totalFaculty: 204,
    minThreshold: 75,
    academicYear: "2026-2027",
    currentSemester: "Fall 2026"
  };

  // Departments
  const departments = [
    { id: "dept_cse", code: "CSE", name: "Computer Science & Engineering", hod: "Dr. Robert Vance", totalStudents: 1450, totalFaculty: 58, icon: "fa-laptop-code" },
    { id: "dept_ece", code: "ECE", name: "Electronics & Communication", hod: "Dr. Meera Nambiar", totalStudents: 1120, totalFaculty: 46, icon: "fa-microchip" },
    { id: "dept_me", code: "ME", name: "Mechanical Engineering", hod: "Dr. Vikram Seth", totalStudents: 980, totalFaculty: 38, icon: "fa-gears" },
    { id: "dept_civil", code: "CIVIL", name: "Civil Engineering", hod: "Dr. Ananya Roy", totalStudents: 720, totalFaculty: 30, icon: "fa-building-columns" },
    { id: "dept_bus", code: "BUS", name: "Business & Data Analytics", hod: "Dr. Sanjay Verma", totalStudents: 850, totalFaculty: 32, icon: "fa-chart-pie" }
  ];

  // Subjects List
  const subjects = [
    // CSE
    { id: "sub_cs301", code: "CS301", name: "Data Structures & Algorithms", deptId: "dept_cse", year: 2, section: "3A", credits: 4, faculty: "Prof. Alan Vance", targetPct: 75 },
    { id: "sub_cs302", code: "CS302", name: "Database Management Systems", deptId: "dept_cse", year: 2, section: "3A", credits: 4, faculty: "Dr. Sarah Jenkins", targetPct: 75 },
    { id: "sub_cs401", code: "CS401", name: "Machine Learning & AI", deptId: "dept_cse", year: 3, section: "5A", credits: 4, faculty: "Prof. Alan Vance", targetPct: 75 },
    { id: "sub_cs402", code: "CS402", name: "Computer Networks & Security", deptId: "dept_cse", year: 3, section: "5A", credits: 3, faculty: "Dr. Robert Vance", targetPct: 75 },
    { id: "sub_cs501", code: "CS501", name: "Cloud Computing Architectures", deptId: "dept_cse", year: 4, section: "7A", credits: 3, faculty: "Prof. David Miller", targetPct: 75 },
    
    // ECE
    { id: "sub_ec301", code: "EC301", name: "Digital Signal Processing", deptId: "dept_ece", year: 2, section: "3B", credits: 4, faculty: "Dr. Meera Nambiar", targetPct: 75 },
    { id: "sub_ec401", code: "EC401", name: "VLSI Circuit Design", deptId: "dept_ece", year: 3, section: "5B", credits: 4, faculty: "Prof. Rajesh Kumar", targetPct: 75 },

    // ME
    { id: "sub_me301", code: "ME301", name: "Thermodynamics & Heat Transfer", deptId: "dept_me", year: 2, section: "3A", credits: 4, faculty: "Dr. Vikram Seth", targetPct: 75 },

    // CIVIL
    { id: "sub_ce301", code: "CE301", name: "Structural Analysis & Design", deptId: "dept_civil", year: 2, section: "3A", credits: 4, faculty: "Dr. Ananya Roy", targetPct: 75 }
  ];

  // Key User Personas for Demo
  const currentUserPersonas = {
    admin: {
      id: "usr_admin",
      name: "Dr. Eleanor Vance",
      role: "admin",
      title: "Dean of Academic Affairs",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      department: "Central Administration",
      email: "dean.academic@sjite.edu"
    },
    hod: {
      id: "usr_hod",
      name: "Dr. Robert Vance",
      role: "hod",
      title: "Head of Dept - Computer Science",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      departmentId: "dept_cse",
      department: "Computer Science & Engineering",
      email: "robert.vance@sjite.edu"
    },
    faculty: {
      id: "usr_faculty",
      name: "Prof. Alan Vance",
      role: "faculty",
      title: "Assistant Professor - CSE",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      departmentId: "dept_cse",
      department: "Computer Science & Engineering",
      email: "alan.vance@sjite.edu"
    },
    student: {
      id: "usr_student_101",
      name: "Maya Lin",
      regNo: "2024CS1042",
      role: "student",
      title: "Student - 3rd Year (Sec 5A)",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      departmentId: "dept_cse",
      department: "Computer Science & Engineering",
      section: "5A",
      year: 3,
      email: "maya.lin@student.sjite.edu",
      phone: "+1 (555) 382-9102",
      guardianEmail: "parent.lin@gmail.com"
    }
  };

  // Sample Section CSE-5A Class Roster (28 Detailed Students for interactive roll call & defaulter engine)
  const cse5aRoster = [
    { id: "usr_student_101", regNo: "2024CS1042", name: "Maya Lin", email: "maya.lin@student.sjite.edu", gender: "F", overallPct: 86.4, status: "Good", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_102", regNo: "2024CS1001", name: "Aarav Sharma", email: "aarav.s@student.sjite.edu", gender: "M", overallPct: 68.2, status: "Warning", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_103", regNo: "2024CS1002", name: "Ananya Patel", email: "ananya.p@student.sjite.edu", gender: "F", overallPct: 92.5, status: "Good", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_104", regNo: "2024CS1003", name: "Rohan Gupta", email: "rohan.g@student.sjite.edu", gender: "M", overallPct: 61.5, status: "Critical", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_105", regNo: "2024CS1004", name: "Chloe Zhao", email: "chloe.z@student.sjite.edu", gender: "F", overallPct: 78.0, status: "Good", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_106", regNo: "2024CS1005", name: "Devansh Varma", email: "devansh.v@student.sjite.edu", gender: "M", overallPct: 58.0, status: "Critical", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_107", regNo: "2024CS1006", name: "Elena Rostova", email: "elena.r@student.sjite.edu", gender: "F", overallPct: 88.9, status: "Good", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_108", regNo: "2024CS1007", name: "Farhan Ali", email: "farhan.a@student.sjite.edu", gender: "M", overallPct: 72.4, status: "Warning", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_109", regNo: "2024CS1008", name: "Gauri Deshmukh", email: "gauri.d@student.sjite.edu", gender: "F", overallPct: 94.0, status: "Good", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_110", regNo: "2024CS1009", name: "Harsh Vardhan", email: "harsh.v@student.sjite.edu", gender: "M", overallPct: 64.0, status: "Critical", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_111", regNo: "2024CS1010", name: "Isha Malhotra", email: "isha.m@student.sjite.edu", gender: "F", overallPct: 84.1, status: "Good", avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_112", regNo: "2024CS1011", name: "Julian Thorne", email: "julian.t@student.sjite.edu", gender: "M", overallPct: 79.5, status: "Good", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_113", regNo: "2024CS1012", name: "Kavya Nair", email: "kavya.n@student.sjite.edu", gender: "F", overallPct: 91.2, status: "Good", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_114", regNo: "2024CS1013", name: "Liam O'Connor", email: "liam.o@student.sjite.edu", gender: "M", overallPct: 70.0, status: "Warning", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_115", regNo: "2024CS1014", name: "Meera Reddy", email: "meera.r@student.sjite.edu", gender: "F", overallPct: 82.3, status: "Good", avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_116", regNo: "2024CS1015", name: "Nikhil Joshi", email: "nikhil.j@student.sjite.edu", gender: "M", overallPct: 54.5, status: "Critical", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_117", regNo: "2024CS1016", name: "Olivia Zhang", email: "olivia.z@student.sjite.edu", gender: "F", overallPct: 96.0, status: "Good", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_118", regNo: "2024CS1017", name: "Pranav Rao", email: "pranav.r@student.sjite.edu", gender: "M", overallPct: 76.2, status: "Good", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_119", regNo: "2024CS1018", name: "Qasim Khan", email: "qasim.k@student.sjite.edu", gender: "M", overallPct: 69.8, status: "Warning", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_120", regNo: "2024CS1019", name: "Riya Sen", email: "riya.s@student.sjite.edu", gender: "F", overallPct: 87.5, status: "Good", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_121", regNo: "2024CS1020", name: "Siddharth Menon", email: "siddharth.m@student.sjite.edu", gender: "M", overallPct: 73.1, status: "Warning", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_122", regNo: "2024CS1021", name: "Tanya Chawla", email: "tanya.c@student.sjite.edu", gender: "F", overallPct: 89.0, status: "Good", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_123", regNo: "2024CS1022", name: "Utkarsh Singh", email: "utkarsh.s@student.sjite.edu", gender: "M", overallPct: 63.8, status: "Critical", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_124", regNo: "2024CS1023", name: "Vedika Kulkarni", email: "vedika.k@student.sjite.edu", gender: "F", overallPct: 93.4, status: "Good", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_125", regNo: "2024CS1024", name: "Will Vance", email: "will.v@student.sjite.edu", gender: "M", overallPct: 77.5, status: "Good", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_126", regNo: "2024CS1025", name: "Yash Agarwal", email: "yash.a@student.sjite.edu", gender: "M", overallPct: 71.0, status: "Warning", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_127", regNo: "2024CS1026", name: "Zara Fernandez", email: "zara.f@student.sjite.edu", gender: "F", overallPct: 88.0, status: "Good", avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80" },
    { id: "usr_student_128", regNo: "2024CS1027", name: "Zayn Malik", email: "zayn.m@student.sjite.edu", gender: "M", overallPct: 59.9, status: "Critical", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" }
  ];

  // Maya Lin's Subject-wise breakdown
  const studentMayaSubjects = [
    { code: "CS401", name: "Machine Learning & AI", totalClasses: 36, attended: 31, percentage: 86.1, faculty: "Prof. Alan Vance" },
    { code: "CS402", name: "Computer Networks & Security", totalClasses: 32, attended: 28, percentage: 87.5, faculty: "Dr. Robert Vance" },
    { code: "CS301", name: "Data Structures & Algorithms", totalClasses: 40, attended: 35, percentage: 87.5, faculty: "Prof. Alan Vance" },
    { code: "CS302", name: "Database Management Systems", totalClasses: 35, attended: 29, percentage: 82.8, faculty: "Dr. Sarah Jenkins" },
    { code: "MA301", name: "Applied Discrete Mathematics", totalClasses: 30, attended: 27, percentage: 90.0, faculty: "Prof. Karen Smith" }
  ];

  // Faculty Class Timetable for Today
  const facultyTodayTimetable = [
    {
      id: "slot_101",
      time: "09:00 AM - 10:00 AM",
      subjectCode: "CS401",
      subjectName: "Machine Learning & AI",
      dept: "CSE",
      year: "3rd Year",
      section: "5A",
      room: "Lab-304 (CS Block)",
      totalStudents: 28,
      status: "COMPLETED",
      sessionSaved: true,
      presentCount: 24,
      absentCount: 3,
      lateCount: 1
    },
    {
      id: "slot_102",
      time: "10:15 AM - 11:15 AM",
      subjectCode: "CS301",
      subjectName: "Data Structures & Algorithms",
      dept: "CSE",
      year: "2nd Year",
      section: "3A",
      room: "Auditorium Hall B",
      totalStudents: 28,
      status: "LIVE_NOW",
      sessionSaved: false
    },
    {
      id: "slot_103",
      time: "01:30 PM - 02:30 PM",
      subjectCode: "CS501",
      subjectName: "Cloud Computing Architectures",
      dept: "CSE",
      year: "4th Year",
      section: "7A",
      room: "Classroom 402",
      totalStudents: 32,
      status: "UPCOMING",
      sessionSaved: false
    }
  ];

  // Correction Requests Queue (Simulating Faculty submissions pending HOD approval)
  const initialCorrectionRequests = [
    {
      id: "COR-2026-089",
      date: "2026-09-22",
      studentId: "usr_student_104",
      studentReg: "2024CS1003",
      studentName: "Rohan Gupta",
      subjectCode: "CS401",
      subjectName: "Machine Learning & AI",
      facultyName: "Prof. Alan Vance",
      originalStatus: "ABSENT",
      requestedStatus: "EXCUSED",
      reason: "Submitted official inter-college hackathon participation certificate.",
      documentUrl: "hackathon_cert_rohan.pdf",
      status: "PENDING",
      timestamp: "2026-09-23 14:30"
    },
    {
      id: "COR-2026-091",
      date: "2026-09-21",
      studentId: "usr_student_106",
      studentReg: "2024CS1005",
      studentName: "Devansh Varma",
      subjectCode: "CS301",
      subjectName: "Data Structures & Algorithms",
      facultyName: "Prof. Alan Vance",
      originalStatus: "ABSENT",
      requestedStatus: "PRESENT",
      reason: "Biometric reader sync glitch at 09:05 AM slot. Verified via class sign-in sheet.",
      documentUrl: "classroom_sheet_sep21.pdf",
      status: "PENDING",
      timestamp: "2026-09-23 16:15"
    },
    {
      id: "COR-2026-074",
      date: "2026-09-18",
      studentId: "usr_student_116",
      studentReg: "2024CS1015",
      studentName: "Nikhil Joshi",
      subjectCode: "CS402",
      subjectName: "Computer Networks & Security",
      facultyName: "Dr. Robert Vance",
      originalStatus: "ABSENT",
      requestedStatus: "EXCUSED",
      reason: "Medical clinic sick slip for viral fever.",
      documentUrl: "medical_note_nikhil.pdf",
      status: "APPROVED",
      reviewedBy: "Dr. Robert Vance (HOD)",
      reviewTimestamp: "2026-09-19 10:00",
      reviewComment: "Verified medical documentation with college clinic."
    }
  ];

  // Audit Logs (History of system actions for Dean/Admin)
  const initialAuditLogs = [
    { id: "LOG-901", timestamp: "2026-09-24 10:15:02", actor: "Prof. Alan Vance", action: "Submitted Attendance Session", details: "CS401 (Sec 5A) - 24 Present, 3 Absent, 1 Late", ip: "192.168.1.45" },
    { id: "LOG-900", timestamp: "2026-09-23 16:15:20", actor: "Prof. Alan Vance", action: "Initiated Correction Request", details: "Rohan Gupta (2024CS1003) CS401 -> EXCUSED", ip: "192.168.1.45" },
    { id: "LOG-899", timestamp: "2026-09-23 14:02:11", actor: "Dr. Robert Vance (HOD)", action: "Approved Correction COR-2026-074", details: "Nikhil Joshi (2024CS1015) status set to EXCUSED", ip: "192.168.1.12" },
    { id: "LOG-898", timestamp: "2026-09-22 09:00:00", actor: "System Daemon", action: "Executed Defaulter Alert Engine", details: "Identified 342 students below 75% threshold across campus", ip: "127.0.0.1" },
    { id: "LOG-897", timestamp: "2026-09-21 17:30:00", actor: "Dr. Eleanor Vance (Dean)", action: "Generated Master Defaulter Report", details: "Exported CSV for Academic Advisory Board", ip: "192.168.1.2" }
  ];

  // Department Attendance Performance Aggregations (for Dean Dashboard)
  const departmentMetrics = [
    { name: "Computer Science", code: "CSE", total: 1450, avgAttendance: 84.6, defaulters: 98, status: "Above Benchmark" },
    { name: "Electronics & Comm", code: "ECE", total: 1120, avgAttendance: 81.2, defaulters: 115, status: "Above Benchmark" },
    { name: "Mechanical Engg", code: "ME", total: 980, avgAttendance: 76.5, defaulters: 142, status: "Requires Attention" },
    { name: "Civil Engineering", code: "CIVIL", total: 720, avgAttendance: 74.1, defaulters: 128, status: "Below Benchmark" },
    { name: "Business & Analytics", code: "BUS", total: 850, avgAttendance: 87.3, defaulters: 42, status: "Excellent" }
  ];

  return {
    institution,
    departments,
    subjects,
    currentUserPersonas,
    cse5aRoster,
    studentMayaSubjects,
    facultyTodayTimetable,
    correctionRequests: [...initialCorrectionRequests],
    auditLogs: [...initialAuditLogs],
    departmentMetrics
  };
})();
