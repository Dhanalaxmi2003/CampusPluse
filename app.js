// CampusPulse - Enterprise College Attendance Management System Controller

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = (() => {
  // Application State
  const state = {
    currentRole: 'faculty', // 'admin' | 'hod' | 'faculty' | 'student'
    roster: [],
    corrections: [],
    auditLogs: [],
    defaulterThreshold: 75,
    activeView: 'dashboard',
    selectedSubject: 'CS401',
    selectedSection: '5A',
    searchQuery: '',
    defaulterFilter: 'ALL',
    scannerActive: false,
    scannerInterval: null,
    // Live session marking state
    sessionData: {}
  };

  // Sound Simulation for QR Scanner
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio fallback
    }
  };

  // Toast Notification System
  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'info') icon = 'fa-circle-info';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon} text-base"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // Initializer
  const init = () => {
    // Clone seed data into reactive state
    state.roster = CampusData.cse5aRoster.map(student => ({
      ...student,
      currentSessionStatus: student.overallPct < 65 ? 'ABSENT' : 'PRESENT'
    }));
    state.corrections = [...CampusData.correctionRequests];
    state.auditLogs = [...CampusData.auditLogs];

    // Bind event listeners
    bindGlobalEvents();
    
    // Render initial role view
    switchRole(state.currentRole);
  };

  // Event Bindings
  const bindGlobalEvents = () => {
    // Defaulter Threshold Slider
    const slider = document.getElementById('threshold-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        state.defaulterThreshold = parseInt(e.target.value);
        document.getElementById('threshold-val').textContent = `${state.defaulterThreshold}%`;
        if (state.activeView === 'defaulters') {
          renderDefaultersView();
        }
      });
    }

    // Roll Call Search Input
    const searchInput = document.getElementById('roster-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderRollCallGrid();
      });
    }
  };

  // Persona Switcher Controller
  const switchRole = (roleKey) => {
    state.currentRole = roleKey;
    const persona = CampusData.currentUserPersonas[roleKey];

    // Update Top User Pill
    const avatarEl = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    const roleEl = document.getElementById('nav-user-role');

    if (avatarEl) avatarEl.src = persona.avatar;
    if (nameEl) nameEl.textContent = persona.name;
    if (roleEl) roleEl.textContent = persona.title;

    // Highlight Role Switcher Buttons
    document.querySelectorAll('.role-switch-btn').forEach(btn => {
      if (btn.dataset.role === roleKey) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
        btn.classList.remove('bg-white/5', 'text-slate-400', 'hover:bg-white/10');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
        btn.classList.add('bg-white/5', 'text-slate-400', 'hover:bg-white/10');
      }
    });

    // Update Navigation Tabs based on Permissions
    renderNavigationTabs();

    // Default view for role
    if (roleKey === 'faculty') {
      setView('rollcall');
    } else if (roleKey === 'student') {
      setView('studentview');
    } else {
      setView('dashboard');
    }

    showToast(`Switched view to persona: ${persona.name} (${persona.title})`, 'info');
  };

  // Render Navbar Tabs according to RBAC
  const renderNavigationTabs = () => {
    const tabsContainer = document.getElementById('nav-tabs-container');
    if (!tabsContainer) return;

    let tabsHtml = '';
    const role = state.currentRole;

    // View options per role
    const allTabs = [
      { id: 'dashboard', name: 'Analytics Dashboard', icon: 'fa-chart-line', roles: ['admin', 'hod'] },
      { id: 'rollcall', name: 'Record Attendance', icon: 'fa-clipboard-user', roles: ['faculty', 'hod', 'admin'] },
      { id: 'corrections', name: `Corrections ${getPendingCorrectionCount() > 0 ? `<span class="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">${getPendingCorrectionCount()}</span>` : ''}`, icon: 'fa-file-signature', roles: ['admin', 'hod', 'faculty'] },
      { id: 'defaulters', name: 'Low Attendance (<75%)', icon: 'fa-triangle-exclamation', roles: ['admin', 'hod', 'faculty'] },
      { id: 'studentview', name: 'My Attendance Portal', icon: 'fa-user-graduate', roles: ['student', 'admin'] },
      { id: 'architecture', name: 'Data Model & Architecture', icon: 'fa-sitemap', roles: ['admin', 'hod', 'faculty', 'student'] }
    ];

    allTabs.forEach(tab => {
      if (tab.roles.includes(role)) {
        const isActive = state.activeView === tab.id;
        tabsHtml += `
          <button onclick="App.setView('${tab.id}')" 
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${isActive ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-md shadow-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <i class="fa-solid ${tab.icon} text-sm"></i>
            <span>${tab.name}</span>
          </button>
        `;
      }
    });

    tabsContainer.innerHTML = tabsHtml;
  };

  const getPendingCorrectionCount = () => {
    return state.corrections.filter(c => c.status === 'PENDING').length;
  };

  // Set Active Main View
  const setView = (viewId) => {
    state.activeView = viewId;
    renderNavigationTabs();

    // Hide all view containers
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));

    // Show selected container
    const activeSec = document.getElementById(`view-${viewId}`);
    if (activeSec) {
      activeSec.classList.remove('hidden');
    }

    // Render logic for specific views
    if (viewId === 'dashboard') renderDashboardView();
    if (viewId === 'rollcall') renderRollCallGrid();
    if (viewId === 'corrections') renderCorrectionsView();
    if (viewId === 'defaulters') renderDefaultersView();
    if (viewId === 'studentview') renderStudentPortalView();
    if (viewId === 'architecture') renderArchitectureView();
  };

  // ==========================================
  // 1. DASHBOARD VIEW (Admin & HOD)
  // ==========================================
  const renderDashboardView = () => {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const isAdmin = state.currentRole === 'admin';

    container.innerHTML = `
      <!-- Metric Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div class="glass-panel p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enrolled Students</p>
              <h3 class="text-3xl font-bold font-heading text-white mt-1">5,120</h3>
              <p class="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <i class="fa-solid fa-arrow-trend-up"></i> Across 5 Departments
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl">
              <i class="fa-solid fa-user-graduate"></i>
            </div>
          </div>
        </div>

        <div class="glass-panel p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Campus Attendance</p>
              <h3 class="text-3xl font-bold font-heading text-emerald-400 mt-1">82.4%</h3>
              <p class="text-xs text-slate-400 mt-2">Target benchmark: 75.0%</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
        </div>

        <div class="glass-panel p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Defaulters (<75%)</p>
              <h3 class="text-3xl font-bold font-heading text-rose-400 mt-1">342</h3>
              <p class="text-xs text-rose-300 mt-2 flex items-center gap-1">
                <i class="fa-solid fa-triangle-exclamation"></i> 6.6% of total campus
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
        </div>

        <div class="glass-panel p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Corrections</p>
              <h3 class="text-3xl font-bold font-heading text-amber-400 mt-1">${getPendingCorrectionCount()}</h3>
              <p class="text-xs text-slate-400 mt-2">Awaiting HOD approval</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Performance Section & Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Dept Breakdown Table -->
        <div class="lg:col-span-2 glass-panel p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-bold font-heading text-white">Departmental Attendance Metrics</h3>
              <p class="text-xs text-slate-400">Real-time stats across academic departments</p>
            </div>
            <button onclick="App.exportReport('csv')" class="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-600/30 transition flex items-center gap-1.5">
              <i class="fa-solid fa-download"></i> Export Report
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th class="pb-3">Department</th>
                  <th class="pb-3 text-center">Students</th>
                  <th class="pb-3 text-center">Avg Attendance</th>
                  <th class="pb-3 text-center">Defaulters (<75%)</th>
                  <th class="pb-3 text-right">Compliance Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${CampusData.departmentMetrics.map(dept => `
                  <tr class="hover:bg-white/5 transition">
                    <td class="py-3.5 font-medium text-white flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                        ${dept.code}
                      </div>
                      <div>
                        <div>${dept.name}</div>
                        <div class="text-[11px] text-slate-400">HOD: ${dept.code === 'CSE' ? 'Dr. Robert Vance' : 'Dept Chair'}</div>
                      </div>
                    </td>
                    <td class="py-3.5 text-center text-slate-300 font-medium">${dept.total.toLocaleString()}</td>
                    <td class="py-3.5 text-center">
                      <div class="inline-flex items-center gap-2">
                        <span class="font-bold ${dept.avgAttendance >= 80 ? 'text-emerald-400' : dept.avgAttendance >= 75 ? 'text-amber-400' : 'text-rose-400'}">${dept.avgAttendance}%</span>
                        <div class="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div class="h-full ${dept.avgAttendance >= 80 ? 'bg-emerald-500' : dept.avgAttendance >= 75 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${dept.avgAttendance}%"></div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 text-center font-semibold text-rose-400">${dept.defaulters}</td>
                    <td class="py-3.5 text-right">
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${dept.avgAttendance >= 80 ? 'badge-present' : dept.avgAttendance >= 75 ? 'badge-warning' : 'badge-critical'}">
                        ${dept.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Attendance Velocity / Visual Stats Card -->
        <div class="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-bold font-heading text-white mb-1">Attendance Distribution</h3>
            <p class="text-xs text-slate-400 mb-6">Today's recorded slots across 204 faculty</p>

            <!-- Visual Bar Graph Mockup -->
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-300 font-medium">Present (84.2%)</span>
                  <span class="text-emerald-400 font-semibold">4,311 Students</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" style="width: 84.2%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-300 font-medium">Absent (11.5%)</span>
                  <span class="text-rose-400 font-semibold">588 Students</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-rose-500 rounded-full" style="width: 11.5%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-300 font-medium">Late / Arrived (2.8%)</span>
                  <span class="text-amber-400 font-semibold">143 Students</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: 2.8%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-300 font-medium">Excused / On-Duty (1.5%)</span>
                  <span class="text-cyan-400 font-semibold">78 Students</span>
                </div>
                <div class="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full bg-cyan-500 rounded-full" style="width: 1.5%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-white/10 mt-6">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Biometric & QR Sync: Active</span>
              <span class="text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-circle text-[8px]"></i> Realtime Live</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Logs Table (For Dean/Admin Compliance Review) -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold font-heading text-white">System Audit & Correction History Log</h3>
            <p class="text-xs text-slate-400">Immutable trail of attendance recordings, edits, and HOD approvals</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            <i class="fa-solid fa-shield-halved mr-1"></i> Audit Lock Active
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th class="pb-3">Log ID & Time</th>
                <th class="pb-3">User / Actor</th>
                <th class="pb-3">Action Description</th>
                <th class="pb-3">Details</th>
                <th class="pb-3 text-right">Source IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${state.auditLogs.map(log => `
                <tr class="hover:bg-white/5 transition">
                  <td class="py-3 font-mono text-indigo-300">
                    <div>${log.id}</div>
                    <div class="text-[10px] text-slate-400">${log.timestamp}</div>
                  </td>
                  <td class="py-3 text-slate-200 font-medium">${log.actor}</td>
                  <td class="py-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/10 text-cyan-300">
                      ${log.action}
                    </span>
                  </td>
                  <td class="py-3 text-slate-300">${log.details}</td>
                  <td class="py-3 text-right font-mono text-slate-400">${log.ip}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ==========================================
  // 2. ATTENDANCE RECORDING & ROLL CALL GRID VIEW
  // ==========================================
  const renderRollCallGrid = () => {
    const container = document.getElementById('view-rollcall');
    if (!container) return;

    // Filter roster by search query
    const filteredRoster = state.roster.filter(s => 
      s.name.toLowerCase().includes(state.searchQuery) ||
      s.regNo.toLowerCase().includes(state.searchQuery)
    );

    // Calculate current session live counts
    const presentCount = state.roster.filter(s => s.currentSessionStatus === 'PRESENT').length;
    const absentCount = state.roster.filter(s => s.currentSessionStatus === 'ABSENT').length;
    const lateCount = state.roster.filter(s => s.currentSessionStatus === 'LATE').length;
    const excusedCount = state.roster.filter(s => s.currentSessionStatus === 'EXCUSED').length;
    const totalCount = state.roster.length;
    const currentPct = ((presentCount / totalCount) * 100).toFixed(1);

    container.innerHTML = `
      <!-- Session Header & Class Timetable Selector -->
      <div class="glass-panel p-6 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                ACTIVE CLASS SESSION
              </span>
              <span class="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <i class="fa-solid fa-circle text-[8px]"></i> Slot Live (10:15 AM - 11:15 AM)
              </span>
            </div>
            <h2 class="text-2xl font-bold font-heading text-white">CS301: Data Structures & Algorithms</h2>
            <p class="text-xs text-slate-400 mt-0.5">Section 5A • 3rd Year B.Tech • Faculty: Prof. Alan Vance • Room: Auditorium B</p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="App.openScannerModal()" class="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2">
              <i class="fa-solid fa-qrcode text-sm"></i>
              <span>Batch QR Scan Mode</span>
            </button>
            <button onclick="App.markAllPresent()" class="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5">
              <i class="fa-solid fa-check-double"></i> Mark All Present
            </button>
            <button onclick="App.invertSelection()" class="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5">
              <i class="fa-solid fa-arrows-rotate"></i> Invert Selection
            </button>
          </div>
        </div>

        <!-- Live Statistics Counter Toolbar -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 text-center">
          <div class="p-3 rounded-xl bg-white/5 border border-white/10">
            <div class="text-xs text-slate-400 font-medium">Total Roster</div>
            <div class="text-xl font-bold text-white mt-0.5">${totalCount}</div>
          </div>
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div class="text-xs text-emerald-400 font-medium">Present</div>
            <div class="text-xl font-bold text-emerald-400 mt-0.5">${presentCount}</div>
          </div>
          <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div class="text-xs text-rose-400 font-medium">Absent</div>
            <div class="text-xl font-bold text-rose-400 mt-0.5">${absentCount}</div>
          </div>
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div class="text-xs text-amber-400 font-medium">Late</div>
            <div class="text-xl font-bold text-amber-400 mt-0.5">${lateCount}</div>
          </div>
          <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 col-span-2 sm:col-span-1">
            <div class="text-xs text-cyan-400 font-medium">Session Attendance</div>
            <div class="text-xl font-bold text-cyan-400 mt-0.5">${currentPct}%</div>
          </div>
        </div>
      </div>

      <!-- Roll Call Grid Controls & Filter -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <!-- Search bar -->
        <div class="relative w-full sm:w-80">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
          <input type="text" id="roster-search" placeholder="Search student name or Reg No..." 
                 value="${state.searchQuery}"
                 class="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs font-medium focus:ring-0">
        </div>

        <div class="text-xs text-slate-400">
          Showing <span class="text-white font-semibold">${filteredRoster.length}</span> of ${totalCount} Students
        </div>
      </div>

      <!-- Student Attendance Roll Call Grid Table -->
      <div class="glass-panel overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th class="py-3.5 px-4">#</th>
                <th class="py-3.5 px-4">Student Details</th>
                <th class="py-3.5 px-4">Reg Number</th>
                <th class="py-3.5 px-4 text-center">Cumul. Attendance %</th>
                <th class="py-3.5 px-4 text-center">Mark Status for Today's Slot</th>
                <th class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${filteredRoster.map((student, idx) => `
                <tr class="hover:bg-white/5 transition ${student.currentSessionStatus === 'ABSENT' ? 'bg-rose-500/5' : ''}">
                  <td class="py-3 px-4 font-mono text-slate-400">${idx + 1}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img src="${student.avatar}" class="w-8 h-8 rounded-full object-cover border border-white/10" alt="${student.name}">
                      <div>
                        <div class="font-semibold text-white">${student.name}</div>
                        <div class="text-[10px] text-slate-400">${student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-mono text-indigo-300 font-medium">${student.regNo}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="font-semibold ${student.overallPct >= 75 ? 'text-emerald-400' : student.overallPct >= 65 ? 'text-amber-400' : 'text-rose-400'}">
                      ${student.overallPct}%
                    </span>
                    ${student.overallPct < 75 ? `<span class="ml-1 text-[10px] text-rose-400" title="Low Attendance Defaulter"><i class="fa-solid fa-triangle-exclamation"></i></span>` : ''}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button onclick="App.setStudentStatus('${student.id}', 'PRESENT')" 
                              class="roll-btn roll-btn-p ${student.currentSessionStatus === 'PRESENT' ? 'active' : ''}">
                        Present
                      </button>
                      <button onclick="App.setStudentStatus('${student.id}', 'ABSENT')" 
                              class="roll-btn roll-btn-a ${student.currentSessionStatus === 'ABSENT' ? 'active' : ''}">
                        Absent
                      </button>
                      <button onclick="App.setStudentStatus('${student.id}', 'LATE')" 
                              class="roll-btn roll-btn-l ${student.currentSessionStatus === 'LATE' ? 'active' : ''}">
                        Late
                      </button>
                      <button onclick="App.setStudentStatus('${student.id}', 'EXCUSED')" 
                              class="roll-btn roll-btn-e ${student.currentSessionStatus === 'EXCUSED' ? 'active' : ''}">
                        Excused
                      </button>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button onclick="App.openCorrectionModal('${student.id}')" 
                            title="Submit Correction Request"
                            class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-300 transition">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Submit Attendance Bar -->
      <div class="glass-panel p-4 flex items-center justify-between sticky bottom-4 z-20 shadow-2xl border-indigo-500/30">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <i class="fa-solid fa-lock"></i>
          </div>
          <div>
            <div class="text-xs font-semibold text-white">Ready to Lock & Lock Session</div>
            <div class="text-[11px] text-slate-400">${presentCount} Present, ${absentCount} Absent • Verification log will be timestamped</div>
          </div>
        </div>

        <button onclick="App.submitAttendanceSession()" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition flex items-center gap-2">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Save & Submit Class Attendance</span>
        </button>
      </div>
    `;
  };

  // Roll Call Helpers
  const setStudentStatus = (studentId, status) => {
    const student = state.roster.find(s => s.id === studentId);
    if (student) {
      student.currentSessionStatus = status;
      renderRollCallGrid();
    }
  };

  const markAllPresent = () => {
    state.roster.forEach(s => s.currentSessionStatus = 'PRESENT');
    renderRollCallGrid();
    showToast('Marked all students as PRESENT for this session');
  };

  const invertSelection = () => {
    state.roster.forEach(s => {
      if (s.currentSessionStatus === 'PRESENT') s.currentSessionStatus = 'ABSENT';
      else if (s.currentSessionStatus === 'ABSENT') s.currentSessionStatus = 'PRESENT';
    });
    renderRollCallGrid();
    showToast('Inverted attendance selections', 'info');
  };

  const submitAttendanceSession = () => {
    const present = state.roster.filter(s => s.currentSessionStatus === 'PRESENT').length;
    const absent = state.roster.filter(s => s.currentSessionStatus === 'ABSENT').length;
    const late = state.roster.filter(s => s.currentSessionStatus === 'LATE').length;

    // Add Audit Log
    const newLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: CampusData.currentUserPersonas[state.currentRole].name,
      action: 'Submitted Attendance Session',
      details: `CS301 (Sec 5A) - ${present} Present, ${absent} Absent, ${late} Late`,
      ip: '192.168.1.45'
    };

    state.auditLogs.unshift(newLog);

    showToast(`Attendance session successfully submitted and locked! (${present} Present, ${absent} Absent)`, 'success');
  };

  // ==========================================
  // 3. ATTENDANCE CORRECTIONS WORKFLOW (HOD & Faculty)
  // ==========================================
  const renderCorrectionsView = () => {
    const container = document.getElementById('view-corrections');
    if (!container) return;

    const isHodOrAdmin = state.currentRole === 'hod' || state.currentRole === 'admin';

    container.innerHTML = `
      <div class="glass-panel p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold font-heading text-white">Attendance Correction & Audit Management</h2>
          <p class="text-xs text-slate-400 mt-1">Two-tier approval workflow for retro-active attendance adjustments</p>
        </div>

        <button onclick="App.openCorrectionModal()" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition flex items-center gap-2">
          <i class="fa-solid fa-plus"></i>
          <span>New Correction Request</span>
        </button>
      </div>

      <!-- Pending Requests Section -->
      <div class="glass-panel p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold font-heading text-white flex items-center gap-2">
            <span>Pending Requests Queue</span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              ${getPendingCorrectionCount()} Requests
            </span>
          </h3>
          ${isHodOrAdmin ? `<span class="text-xs text-emerald-400"><i class="fa-solid fa-user-shield"></i> You have HOD Approval Rights</span>` : `<span class="text-xs text-slate-400">Awaiting HOD Sign-off</span>`}
        </div>

        <div class="space-y-4">
          ${state.corrections.filter(c => c.status === 'PENDING').length === 0 ? `
            <div class="p-8 text-center text-slate-400 text-xs">
              <i class="fa-solid fa-circle-check text-2xl text-emerald-400 mb-2"></i>
              <div>No pending correction requests. All records are up to date!</div>
            </div>
          ` : state.corrections.filter(c => c.status === 'PENDING').map(req => `
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-indigo-500/30 transition">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs">
                  ${req.subjectCode}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white text-sm">${req.studentName}</span>
                    <span class="font-mono text-xs text-slate-400">(${req.studentReg})</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300">${req.date}</span>
                  </div>
                  <div class="text-xs text-slate-300 mt-1">
                    Status Change: 
                    <span class="badge-absent px-2 py-0.5 rounded text-[10px] uppercase font-bold">${req.originalStatus}</span>
                    <i class="fa-solid fa-arrow-right text-[10px] mx-1 text-slate-400"></i>
                    <span class="badge-present px-2 py-0.5 rounded text-[10px] uppercase font-bold">${req.requestedStatus}</span>
                  </div>
                  <div class="text-xs text-slate-400 mt-2 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                    <i class="fa-solid fa-quote-left text-[10px] text-indigo-400 mr-1"></i> ${req.reason}
                  </div>
                </div>
              </div>

              <!-- HOD Action Buttons -->
              <div class="flex items-center gap-2 shrink-0 self-end lg:self-center">
                ${isHodOrAdmin ? `
                  <button onclick="App.processCorrection('${req.id}', 'APPROVED')" 
                          class="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5">
                    <i class="fa-solid fa-check"></i> Approve
                  </button>
                  <button onclick="App.processCorrection('${req.id}', 'REJECTED')" 
                          class="px-3.5 py-2 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-semibold text-xs transition flex items-center gap-1.5">
                    <i class="fa-solid fa-xmark"></i> Reject
                  </button>
                ` : `
                  <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-amber-300 font-medium">
                    <i class="fa-solid fa-hourglass-half mr-1"></i> Pending Review
                  </span>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Past Correction History -->
      <div class="glass-panel p-6">
        <h3 class="text-lg font-bold font-heading text-white mb-4">Completed Request Logs</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th class="pb-3">Req ID</th>
                <th class="pb-3">Student</th>
                <th class="pb-3">Subject</th>
                <th class="pb-3">Proposed Change</th>
                <th class="pb-3">HOD Outcome</th>
                <th class="pb-3 text-right">Reviewer</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${state.corrections.filter(c => c.status !== 'PENDING').map(c => `
                <tr class="hover:bg-white/5 transition">
                  <td class="py-3 font-mono text-indigo-300">${c.id}</td>
                  <td class="py-3 text-white font-medium">${c.studentName}</td>
                  <td class="py-3 text-slate-300">${c.subjectCode}</td>
                  <td class="py-3 text-slate-300">${c.originalStatus} &rarr; ${c.requestedStatus}</td>
                  <td class="py-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'APPROVED' ? 'badge-present' : 'badge-absent'}">
                      ${c.status}
                    </span>
                  </td>
                  <td class="py-3 text-right text-slate-400">${c.reviewedBy || 'System Admin'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const processCorrection = (reqId, outcome) => {
    const req = state.corrections.find(c => c.id === reqId);
    if (req) {
      req.status = outcome;
      req.reviewedBy = CampusData.currentUserPersonas[state.currentRole].name;

      // Update student overall pct simulation
      const student = state.roster.find(s => s.id === req.studentId);
      if (student && outcome === 'APPROVED') {
        student.overallPct = Math.min(100, (parseFloat(student.overallPct) + 3.5).toFixed(1));
        if (student.overallPct >= 75) student.status = 'Good';
      }

      // Add to audit logs
      state.auditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: req.reviewedBy,
        action: `${outcome} Correction Request`,
        details: `${req.studentName} (${req.studentReg}) set to ${req.requestedStatus}`,
        ip: '192.168.1.12'
      });

      renderCorrectionsView();
      showToast(`Correction request ${reqId} ${outcome.toLowerCase()} by HOD!`, outcome === 'APPROVED' ? 'success' : 'info');
    }
  };

  // ==========================================
  // 4. LOW ATTENDANCE IDENTIFICATION & RISK ENGINE (< 75%)
  // ==========================================
  const renderDefaultersView = () => {
    const container = document.getElementById('view-defaulters');
    if (!container) return;

    const threshold = state.defaulterThreshold;
    const defaultersList = state.roster.filter(s => s.overallPct < threshold);

    container.innerHTML = `
      <!-- Threshold Filter & Header Banner -->
      <div class="glass-panel p-6 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                ACADEMIC COMPLIANCE CONTROL
              </span>
            </div>
            <h2 class="text-2xl font-bold font-heading text-white">Low Attendance Identification & Warning Dispatcher</h2>
            <p class="text-xs text-slate-400 mt-0.5">Automated tracking for students falling below the target threshold</p>
          </div>

          <!-- Slider Controller -->
          <div class="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div class="text-xs">
              <div class="text-slate-400 font-medium">Compliance Cutoff Threshold</div>
              <div class="text-lg font-bold text-indigo-400" id="threshold-val">${threshold}%</div>
            </div>
            <input type="range" id="threshold-slider" min="60" max="85" value="${threshold}" class="w-36 accent-indigo-500 cursor-pointer">
          </div>
        </div>

        <!-- Action Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400">Total Defaulters Identified:</span>
            <span class="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              ${defaultersList.length} Students
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="App.openBatchWarningModal()" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5">
              <i class="fa-solid fa-paper-plane"></i> Send Batch Email Warnings
            </button>
            <button onclick="App.generateHallTicketReport()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5">
              <i class="fa-solid fa-file-pdf"></i> Generate Hall Ticket Blocklist
            </button>
          </div>
        </div>
      </div>

      <!-- Defaulters Table -->
      <div class="glass-panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th class="py-3.5 px-4">Student Name</th>
                <th class="py-3.5 px-4">Reg Number</th>
                <th class="py-3.5 px-4 text-center">Overall Attendance %</th>
                <th class="py-3.5 px-4 text-center">Shortage Severity</th>
                <th class="py-3.5 px-4 text-center">Classes Needed to Reach ${threshold}%</th>
                <th class="py-3.5 px-4 text-right">Exam Eligibility Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${defaultersList.map(student => {
                const classesNeeded = Math.ceil((threshold * 40 - student.overallPct * 0.4 * 40) / (100 - threshold));
                const isCritical = student.overallPct < 65;

                return `
                  <tr class="hover:bg-white/5 transition">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <img src="${student.avatar}" class="w-8 h-8 rounded-full object-cover border border-white/10" alt="">
                        <div>
                          <div class="font-semibold text-white">${student.name}</div>
                          <div class="text-[10px] text-slate-400">${student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 font-mono text-indigo-300 font-medium">${student.regNo}</td>
                    <td class="py-3.5 px-4 text-center font-bold text-lg ${isCritical ? 'text-rose-400' : 'text-amber-400'}">
                      ${student.overallPct}%
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="px-2.5 py-1 rounded-full font-bold ${isCritical ? 'badge-critical' : 'badge-warning'}">
                        ${isCritical ? 'CRITICAL (<65%)' : 'WARNING (65-74%)'}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold font-mono">
                        +${classesNeeded} Classes
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <span class="px-2.5 py-1 rounded-full font-semibold ${isCritical ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-amber-950 text-amber-300 border border-amber-600'}">
                        ${isCritical ? 'BARRED FROM EXAMS' : 'CONDONATION REQ'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ==========================================
  // 5. STUDENT SELF-SERVICE PORTAL VIEW
  // ==========================================
  const renderStudentPortalView = () => {
    const container = document.getElementById('view-studentview');
    if (!container) return;

    const student = CampusData.currentUserPersonas.student;
    const subjects = CampusData.studentMayaSubjects;

    container.innerHTML = `
      <!-- Student Profile Card Header -->
      <div class="glass-panel p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-5">
          <img src="${student.avatar}" class="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl" alt="">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-bold font-heading text-white">${student.name}</h2>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                Good Standing
              </span>
            </div>
            <p class="text-xs text-slate-300 mt-1">${student.department} • Year ${student.year} (Section ${student.section})</p>
            <p class="text-xs font-mono text-indigo-300 mt-1">Roll No: ${student.regNo} • ${student.email}</p>
          </div>
        </div>

        <div class="bg-white/5 p-4 rounded-2xl border border-white/10 text-center min-w-[180px]">
          <div class="text-xs text-slate-400 font-medium">Overall Cumulative Attendance</div>
          <div class="text-3xl font-bold font-heading text-emerald-400 mt-1">86.4%</div>
          <div class="text-[11px] text-slate-400 mt-1">Eligible for all End-Sem Examinations</div>
        </div>
      </div>

      <!-- Subject-wise Progress Grid & Calculator -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Subject Attendance Cards -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="text-lg font-bold font-heading text-white">Subject Attendance Breakdown</h3>

          ${subjects.map(sub => `
            <div class="glass-panel p-5 hover:border-indigo-500/40 transition">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono font-bold">${sub.code}</span>
                  <h4 class="text-base font-bold text-white inline-block ml-2">${sub.name}</h4>
                  <div class="text-xs text-slate-400 mt-0.5">Faculty: ${sub.faculty}</div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold font-heading ${sub.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}">${sub.percentage}%</div>
                  <div class="text-xs text-slate-400">${sub.attended} / ${sub.totalClasses} Classes</div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div class="h-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}" style="width: ${sub.percentage}%"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Target Attendance Calculator Widget -->
        <div class="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2 text-indigo-400">
              <i class="fa-solid fa-calculator text-lg"></i>
              <h3 class="text-lg font-bold font-heading text-white">Target Attendance Calculator</h3>
            </div>
            <p class="text-xs text-slate-400 mb-6">Calculate how many consecutive upcoming classes you must attend to maintain or reach your target percentage.</p>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-300 mb-1 font-medium">Select Subject</label>
                <select id="calc-subject" class="w-full p-2.5 rounded-xl glass-input text-xs font-medium">
                  ${subjects.map(s => `<option value="${s.code}">${s.code} - ${s.name} (${s.percentage}%)</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-slate-300 mb-1 font-medium">Desired Target Percentage (%)</label>
                <input type="number" id="calc-target" value="75" min="60" max="100" class="w-full p-2.5 rounded-xl glass-input text-xs font-medium">
              </div>

              <button onclick="App.runAttendanceCalc()" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition">
                Calculate Required Classes
              </button>
            </div>

            <!-- Result Display Box -->
            <div id="calc-result" class="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hidden">
              <div class="text-xs text-indigo-300 font-semibold mb-1">Calculation Result:</div>
              <div class="text-sm font-bold text-white" id="calc-result-text"></div>
            </div>
          </div>

          <!-- Submit Absence Excuse Note -->
          <div class="pt-6 border-t border-white/10 mt-6">
            <button onclick="App.openExcuseModal()" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-file-arrow-up"></i>
              <span>Submit Medical / OD Excuse Note</span>
            </button>
          </div>
        </div>
      </div>
    `;
  };

  const runAttendanceCalc = () => {
    const code = document.getElementById('calc-subject').value;
    const target = parseFloat(document.getElementById('calc-target').value);
    const sub = CampusData.studentMayaSubjects.find(s => s.code === code);

    if (sub) {
      const resultBox = document.getElementById('calc-result');
      const resultText = document.getElementById('calc-result-text');
      resultBox.classList.remove('hidden');

      if (sub.percentage >= target) {
        // Calculate max classes student can skip
        const maxSkip = Math.floor((sub.attended - (target / 100) * sub.totalClasses) / (target / 100));
        resultText.innerHTML = `You are already above ${target}%! You can safely skip up to <span class="text-emerald-400 font-bold">${Math.max(0, maxSkip)}</span> upcoming classes while staying above your target.`;
      } else {
        // Calculate needed classes
        const needed = Math.ceil((target * sub.totalClasses - 100 * sub.attended) / (100 - target));
        resultText.innerHTML = `You must attend the next <span class="text-amber-400 font-bold">${needed}</span> consecutive classes without missing any to reach ${target}%.`;
      }
    }
  };

  // ==========================================
  // 6. SYSTEM ARCHITECTURE & DATA MODEL VIEW
  // ==========================================
  const renderArchitectureView = () => {
    const container = document.getElementById('view-architecture');
    if (!container) return;

    container.innerHTML = `
      <div class="glass-panel p-6 mb-8">
        <h2 class="text-2xl font-bold font-heading text-white">System Architecture & Database Schema</h2>
        <p class="text-xs text-slate-400 mt-1">High-level specification for the 5,000-student attendance management infrastructure</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Core Database Tables Schema -->
        <div class="glass-panel p-6">
          <h3 class="text-lg font-bold font-heading text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-database text-indigo-400"></i> Relational Data Model (Normalized Schemas)
          </h3>

          <div class="space-y-4 text-xs font-mono">
            <div class="p-3.5 rounded-xl bg-slate-900 border border-white/10">
              <div class="text-indigo-400 font-bold mb-1">TABLE: Department</div>
              <div class="text-slate-300">id (PK), code, name, hod_user_id, created_at</div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-900 border border-white/10">
              <div class="text-indigo-400 font-bold mb-1">TABLE: User</div>
              <div class="text-slate-300">id (PK), reg_no, name, email, role [ADMIN|HOD|FACULTY|STUDENT], department_id (FK), phone</div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-900 border border-white/10">
              <div class="text-indigo-400 font-bold mb-1">TABLE: CourseSection</div>
              <div class="text-slate-300">id (PK), department_id (FK), academic_year, section_name, total_enrolled</div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-900 border border-white/10">
              <div class="text-indigo-400 font-bold mb-1">TABLE: AttendanceSession</div>
              <div class="text-slate-300">id (PK), schedule_id (FK), faculty_id (FK), session_date, slot_time, status [DRAFT|SUBMITTED|LOCKED]</div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-900 border border-white/10">
              <div class="text-indigo-400 font-bold mb-1">TABLE: CorrectionRequest</div>
              <div class="text-slate-300">id (PK), record_id (FK), faculty_id (FK), original_status, new_status, reason, status [PENDING|APPROVED|REJECTED], hod_id (FK)</div>
            </div>
          </div>
        </div>

        <!-- Workflow Diagram & Scale Specs -->
        <div class="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-bold font-heading text-white mb-4 flex items-center gap-2">
              <i class="fa-solid fa-network-wired text-cyan-400"></i> Operational Scale & Performance
            </h3>

            <div class="space-y-4 text-xs">
              <div class="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <div class="font-bold text-indigo-300 text-sm mb-1">Scale Metrics</div>
                <ul class="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li><strong class="text-white">Students:</strong> ~5,000 active enrollments</li>
                  <li><strong class="text-white">Faculty Members:</strong> 204 active professors</li>
                  <li><strong class="text-white">Daily Class Sessions:</strong> ~1,200 time-slots recorded daily</li>
                  <li><strong class="text-white">Monthly Attendance Records:</strong> ~360,000 logs processed per month</li>
                </ul>
              </div>

              <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div class="font-bold text-emerald-300 text-sm mb-1">Security & Tamper-Proofing</div>
                <p class="text-slate-300 leading-relaxed">
                  Sessions auto-lock 24 hours after completion. All status modifications require two-tier HOD digital approval and generate immutable entries in the system Audit Log.
                </p>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-white/10 mt-6">
            <button onclick="App.openArchitectureModal()" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-diagram-project"></i>
              <span>Open Visual Workflow Modal</span>
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // ==========================================
  // MODALS & DIALOG HANDLERS
  // ==========================================

  // QR Scanner Modal Simulation
  const openScannerModal = () => {
    const modal = document.getElementById('modal-scanner');
    if (modal) {
      modal.classList.remove('hidden');
      startSimulatedScan();
    }
  };

  const closeScannerModal = () => {
    const modal = document.getElementById('modal-scanner');
    if (modal) {
      modal.classList.add('hidden');
      if (state.scannerInterval) clearInterval(state.scannerInterval);
    }
  };

  const startSimulatedScan = () => {
    const logContainer = document.getElementById('scanner-log');
    if (!logContainer) return;
    logContainer.innerHTML = '<div class="text-xs text-indigo-300">Scanner initialized. Ready for Student QR ID cards...</div>';

    let count = 0;
    state.scannerInterval = setInterval(() => {
      count++;
      if (count > 5) {
        clearInterval(state.scannerInterval);
        return;
      }

      // Pick random student from roster
      const randStudent = state.roster[Math.floor(Math.random() * state.roster.length)];
      randStudent.currentSessionStatus = 'PRESENT';
      playBeep();

      const item = document.createElement('div');
      item.className = 'text-xs text-emerald-400 font-mono py-1 border-b border-white/5 flex justify-between';
      item.innerHTML = `<span>[SCANNED] ${randStudent.name} (${randStudent.regNo})</span> <span>CONFIRMED</span>`;
      logContainer.prepend(item);

      renderRollCallGrid();
    }, 2200);
  };

  // Correction Modal
  const openCorrectionModal = (studentId = null) => {
    const modal = document.getElementById('modal-correction');
    if (!modal) return;

    modal.classList.remove('hidden');

    const select = document.getElementById('corr-student');
    if (select) {
      select.innerHTML = state.roster.map(s => `
        <option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.name} (${s.regNo})</option>
      `).join('');
    }
  };

  const closeCorrectionModal = () => {
    const modal = document.getElementById('modal-correction');
    if (modal) modal.classList.add('hidden');
  };

  const submitCorrectionForm = (e) => {
    e.preventDefault();
    const studentId = document.getElementById('corr-student').value;
    const requestedStatus = document.getElementById('corr-status').value;
    const reason = document.getElementById('corr-reason').value;

    const student = state.roster.find(s => s.id === studentId);

    const newReq = {
      id: `COR-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentReg: student.regNo,
      studentName: student.name,
      subjectCode: 'CS301',
      subjectName: 'Data Structures & Algorithms',
      facultyName: CampusData.currentUserPersonas[state.currentRole].name,
      originalStatus: 'ABSENT',
      requestedStatus,
      reason,
      status: 'PENDING',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    state.corrections.unshift(newReq);
    closeCorrectionModal();
    renderNavigationTabs();
    if (state.activeView === 'corrections') renderCorrectionsView();
    showToast('Correction request submitted! Awaiting HOD review.', 'success');
  };

  // Batch Warning Email Modal
  const openBatchWarningModal = () => {
    const modal = document.getElementById('modal-warning');
    if (modal) modal.classList.remove('hidden');
  };

  const closeBatchWarningModal = () => {
    const modal = document.getElementById('modal-warning');
    if (modal) modal.classList.add('hidden');
  };

  const sendBatchWarnings = () => {
    closeBatchWarningModal();
    showToast('Automated warning notifications & SMS dispatched to 28 defaulter guardians!', 'success');
  };

  // Excuse Note Modal
  const openExcuseModal = () => {
    const modal = document.getElementById('modal-excuse');
    if (modal) modal.classList.remove('hidden');
  };
  const closeExcuseModal = () => {
    const modal = document.getElementById('modal-excuse');
    if (modal) modal.classList.add('hidden');
  };
  const submitExcuseNote = (e) => {
    e.preventDefault();
    closeExcuseModal();
    showToast('Absence Excuse application submitted to HOD office for review!', 'success');
  };

  // Architecture Modal
  const openArchitectureModal = () => {
    const modal = document.getElementById('modal-architecture');
    if (modal) modal.classList.remove('hidden');
  };
  const closeArchitectureModal = () => {
    const modal = document.getElementById('modal-architecture');
    if (modal) modal.classList.add('hidden');
  };

  // Report Exporter
  const exportReport = (format) => {
    if (format === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,RegNo,Name,Department,OverallAttendancePct,Status\n";
      state.roster.forEach(s => {
        csvContent += `${s.regNo},"${s.name}",CSE,${s.overallPct}%,${s.overallPct < 75 ? 'Defaulter' : 'Eligible'}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "CampusPulse_Attendance_Report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported Attendance Report to CSV', 'success');
    }
  };

  const generateHallTicketReport = () => {
    window.print();
  };

  return {
    init,
    switchRole,
    setView,
    setStudentStatus,
    markAllPresent,
    invertSelection,
    submitAttendanceSession,
    processCorrection,
    runAttendanceCalc,
    openScannerModal,
    closeScannerModal,
    openCorrectionModal,
    closeCorrectionModal,
    submitCorrectionForm,
    openBatchWarningModal,
    closeBatchWarningModal,
    sendBatchWarnings,
    openExcuseModal,
    closeExcuseModal,
    submitExcuseNote,
    openArchitectureModal,
    closeArchitectureModal,
    exportReport,
    generateHallTicketReport
  };
})();
