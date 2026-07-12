/**
 * app.js
 * App view routing, DOM events coordination, and UI state syncing.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // DOM Cache Queries
  // ==========================================================================
  const DOM = {
    // Screens
    loginScreen: document.getElementById('login-screen'),
    appContainer: document.getElementById('app-container'),
    
    // Login
    loginForm: document.getElementById('login-form'),
    loginIdInput: document.getElementById('login-id-input'),
    loginError: document.getElementById('login-error'),
    roleStudentBtn: document.getElementById('role-student-btn'),
    roleFacultyBtn: document.getElementById('role-faculty-btn'),
    loginIdLabel: document.getElementById('login-id-label'),
    loginIconField: document.getElementById('login-icon-field'),
    hintBadges: document.querySelectorAll('.hint-badge'),
    
    // Header
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    userAvatarInitials: document.getElementById('user-avatar-initials'),
    userDisplayName: document.getElementById('user-display-name'),
    userDisplayRole: document.getElementById('user-display-role'),
    logoutTriggerBtn: document.getElementById('logout-trigger-btn'),
    brandHomeLink: document.getElementById('brand-home-link'),
    
    // Sidebar
    navLinks: document.querySelectorAll('.nav-link'),
    studentOnlyLinks: document.querySelectorAll('.student-only'),
    facultyOnlyLinks: document.querySelectorAll('.faculty-only'),
    
    // Panels
    viewPanels: document.querySelectorAll('.view-panel'),
    
    // Student Panel Nodes
    studentWelcomeTitle: document.getElementById('student-welcome-title'),
    studentProfileDept: document.getElementById('student-profile-dept'),
    studentProfileYear: document.getElementById('student-profile-year'),
    studentProfileId: document.getElementById('student-profile-id'),
    studentDashboardActivities: document.getElementById('student-dashboard-activities'),
    studentViewAllActivitiesBtn: document.getElementById('student-view-all-activities-btn'),
    studentAttendanceGauge: document.getElementById('student-attendance-gauge'),
    studentAttendanceValue: document.getElementById('student-attendance-value'),
    studentAttendanceStatusBadge: document.getElementById('student-attendance-status-badge'),
    studentPresentCount: document.getElementById('student-present-count'),
    studentAbsentCount: document.getElementById('student-absent-count'),
    studentTotalLectures: document.getElementById('student-total-lectures'),
    studentActivitiesList: document.getElementById('student-activities-list'),
    
    // Faculty Panel Nodes
    facultyWelcomeTitle: document.getElementById('faculty-welcome-title'),
    facultyStatStudents: document.getElementById('faculty-stat-students'),
    facultyStatAttendance: document.getElementById('faculty-stat-attendance'),
    facultyStatActivities: document.getElementById('faculty-stat-activities'),
    facultyQuickAttendanceBtn: document.getElementById('faculty-quick-attendance-btn'),
    facultyQuickActivityBtn: document.getElementById('faculty-quick-activity-btn'),
    facultyQuickReportsBtn: document.getElementById('faculty-quick-reports-btn'),
    
    // Faculty Attendance Manager
    attendanceDateSelect: document.getElementById('attendance-date-select'),
    attendanceDeptSelect: document.getElementById('attendance-dept-select'),
    attendanceYearSelect: document.getElementById('attendance-year-select'),
    attendanceMarkAllPresent: document.getElementById('attendance-mark-all-present'),
    attendanceMarkAllAbsent: document.getElementById('attendance-mark-all-absent'),
    attendanceStudentsTable: document.getElementById('attendance-students-table'),
    attendanceStudentsBody: document.getElementById('attendance-students-body'),
    attendanceSaveBtn: document.getElementById('attendance-save-btn'),
    attendanceSaveStatus: document.getElementById('attendance-save-status'),
    
    // Faculty Activity Manager
    activityCreateForm: document.getElementById('activity-create-form'),
    activityTitle: document.getElementById('activity-title'),
    activityDate: document.getElementById('activity-date'),
    activityDescription: document.getElementById('activity-description'),
    facultyActivitiesList: document.getElementById('faculty-activities-list'),
    
    // Reports Ledger
    reportsPrintBtn: document.getElementById('reports-print-btn'),
    reportFilterSearch: document.getElementById('report-filter-search'),
    reportFilterDept: document.getElementById('report-filter-dept'),
    reportFilterYear: document.getElementById('report-filter-year'),
    reportRecordsCount: document.getElementById('report-records-count'),
    reportSummaryTable: document.getElementById('report-summary-table'),
    reportSummaryBody: document.getElementById('report-summary-body'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // State Variables
  let currentRoleSelection = 'student'; // 'student' or 'faculty'
  let currentUser = null;

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  const showToast = (message, type = 'success', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    
    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Trigger transition Reflow
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Helper: Format Date as YYYY-MM-DD Local Date
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ==========================================================================
  // Theme Toggle System
  // ==========================================================================
  const initTheme = () => {
    const savedTheme = localStorage.getItem('scaa_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  };

  const updateThemeIcon = (theme) => {
    const icon = DOM.themeToggleBtn.querySelector('i');
    if (theme === 'light') {
      icon.className = 'fa-solid fa-sun';
      DOM.themeToggleBtn.title = 'Switch to Dark Mode';
    } else {
      icon.className = 'fa-solid fa-moon';
      DOM.themeToggleBtn.title = 'Switch to Light Mode';
    }
  };

  DOM.themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('scaa_theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Redraw charts to match new theme colors
    if (DOM.appContainer.style.display !== 'none') {
      refreshReportsTab();
    }
  });

  // ==========================================================================
  // Login Role Tabs Handler
  // ==========================================================================
  const setLoginRole = (role) => {
    currentRoleSelection = role;
    if (role === 'student') {
      DOM.roleStudentBtn.classList.add('active');
      DOM.roleStudentBtn.setAttribute('aria-selected', 'true');
      DOM.roleFacultyBtn.classList.remove('active');
      DOM.roleFacultyBtn.setAttribute('aria-selected', 'false');
      DOM.loginIdLabel.textContent = 'Student ID';
      DOM.loginIdInput.placeholder = 'e.g. S101';
      DOM.loginIconField.className = 'fa-solid fa-id-card';
    } else {
      DOM.roleFacultyBtn.classList.add('active');
      DOM.roleFacultyBtn.setAttribute('aria-selected', 'true');
      DOM.roleStudentBtn.classList.remove('active');
      DOM.roleStudentBtn.setAttribute('aria-selected', 'false');
      DOM.loginIdLabel.textContent = 'Faculty ID';
      DOM.loginIdInput.placeholder = 'e.g. F201';
      DOM.loginIconField.className = 'fa-solid fa-id-badge';
    }
    DOM.loginError.classList.remove('show');
    DOM.loginIdInput.value = '';
    DOM.loginIdInput.focus();
  };

  DOM.roleStudentBtn.addEventListener('click', () => setLoginRole('student'));
  DOM.roleFacultyBtn.addEventListener('click', () => setLoginRole('faculty'));

  // Quick autofill for demo testing
  DOM.hintBadges.forEach(badge => {
    badge.addEventListener('click', () => {
      const text = badge.textContent;
      const targetRole = text.toUpperCase().startsWith('S') ? 'student' : 'faculty';
      
      setLoginRole(targetRole);
      DOM.loginIdInput.value = text;
      
      // Auto-trigger submit
      triggerLogin();
    });
  });

  // Form submission
  DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerLogin();
  });

  const triggerLogin = () => {
    const id = DOM.loginIdInput.value.trim();
    if (!id) {
      DOM.loginError.querySelector('span').textContent = 'Please enter an ID.';
      DOM.loginError.classList.add('show');
      return;
    }

    const session = Auth.login(id);
    if (session) {
      currentUser = session;
      DOM.loginError.classList.remove('show');
      bootstrapApp();
      showToast(`Welcome back, ${session.name}!`, 'success');
    } else {
      DOM.loginError.querySelector('span').textContent = `Invalid ${currentRoleSelection === 'student' ? 'Student' : 'Faculty'} ID. Check demo credentials below.`;
      DOM.loginError.classList.add('show');
      showToast('Login failed', 'danger');
    }
  };

  // ==========================================================================
  // Main Bootstrap & View Router Systems
  // ==========================================================================
  const bootstrapApp = () => {
    // Hide login, show App Container
    DOM.loginScreen.style.display = 'none';
    DOM.appContainer.style.display = 'block';

    // Populate user profile info in header header
    DOM.userDisplayName.textContent = currentUser.name;
    DOM.userDisplayRole.textContent = currentUser.role;
    
    // Initials for avatar
    const names = currentUser.name.split(' ');
    const initials = names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    DOM.userAvatarInitials.textContent = initials;

    // Toggle Sidebar Nav menus based on roles
    if (currentUser.role === 'student') {
      DOM.studentOnlyLinks.forEach(l => l.style.display = 'flex');
      DOM.facultyOnlyLinks.forEach(l => l.style.display = 'none');
      switchView('student-dashboard');
    } else {
      DOM.studentOnlyLinks.forEach(l => l.style.display = 'none');
      DOM.facultyOnlyLinks.forEach(l => l.style.display = 'flex');
      switchView('faculty-dashboard');
    }

    // Set default dates
    const todayStr = getLocalDateString();
    if (DOM.attendanceDateSelect) DOM.attendanceDateSelect.value = todayStr;
    if (DOM.activityDate) DOM.activityDate.value = todayStr;
  };

  const switchView = (targetViewId) => {
    // Deactivate all panels and sidebar links
    DOM.viewPanels.forEach(p => p.classList.remove('active'));
    DOM.navLinks.forEach(l => l.classList.remove('active'));

    // Activate selected sidebar link
    const targetLink = Array.from(DOM.navLinks).find(l => l.getAttribute('data-view') === targetViewId);
    if (targetLink) targetLink.classList.add('active');

    // Activate corresponding panel
    const targetPanel = document.getElementById(targetViewId);
    if (targetPanel) {
      targetPanel.classList.add('active');
      
      // Perform sub-view refreshes
      if (targetViewId === 'student-dashboard') refreshStudentDashboard();
      if (targetViewId === 'student-activities') refreshStudentActivities();
      if (targetViewId === 'faculty-dashboard') refreshFacultyDashboard();
      if (targetViewId === 'faculty-attendance') refreshFacultyAttendanceTab();
      if (targetViewId === 'faculty-activities') refreshFacultyActivitiesTab();
      if (targetViewId === 'reports') refreshReportsTab();
    }
  };

  // Bind navigation triggers
  DOM.navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const viewId = link.getAttribute('data-view');
      switchView(viewId);
    });
  });

  // Logo home navigation
  DOM.brandHomeLink.addEventListener('click', () => {
    if (currentUser) {
      const dashboardId = currentUser.role === 'student' ? 'student-dashboard' : 'faculty-dashboard';
      switchView(dashboardId);
    }
  });

  // Logout Trigger
  DOM.logoutTriggerBtn.addEventListener('click', () => {
    Auth.logout();
    currentUser = null;
    DOM.appContainer.style.display = 'none';
    DOM.loginScreen.style.display = 'flex';
    DOM.loginIdInput.value = '';
    DOM.loginError.classList.remove('show');
    showToast('Logged out successfully', 'success');
  });

  // ==========================================================================
  // STUDENT DASHBOARD CONTROLLERS
  // ==========================================================================
  const updateAttendanceGauge = (percentage) => {
    const gauge = DOM.studentAttendanceGauge;
    if (!gauge) return;
    
    DOM.studentAttendanceValue.innerHTML = `${percentage}%<span>Attendance</span>`;
    
    // Colors: Green for >= 75 (Passing threshold), Yellow/Gold for >= 60, Red < 60
    let color = 'var(--danger)';
    let statusText = 'Critical - Low Attendance';
    let badgeClass = 'badge-danger';
    
    if (percentage >= 75) {
      color = 'var(--success)';
      statusText = 'Excellent attendance';
      badgeClass = 'badge-success';
    } else if (percentage >= 60) {
      color = 'var(--warning)';
      statusText = 'Average attendance';
      badgeClass = 'badge-warning';
    }
    
    DOM.studentAttendanceStatusBadge.textContent = statusText;
    DOM.studentAttendanceStatusBadge.className = `badge ${badgeClass}`;
    
    const deg = percentage * 3.6;
    gauge.style.background = `conic-gradient(${color} ${deg}deg, var(--bg-tertiary) ${deg}deg)`;
  };

  const refreshStudentDashboard = () => {
    const studentData = currentUser.details;
    
    // Info banners
    DOM.studentWelcomeTitle.textContent = `Welcome back, ${studentData.Name.split(' ')[0]}!`;
    DOM.studentProfileDept.textContent = studentData.Department;
    DOM.studentProfileYear.textContent = studentData.Year;
    DOM.studentProfileId.textContent = studentData.StudentID;

    // Get attendance calculations
    const stats = Reports.getStudentStats(studentData.StudentID);
    updateAttendanceGauge(stats.percentage);
    
    DOM.studentPresentCount.textContent = stats.present;
    DOM.studentAbsentCount.textContent = stats.absent;
    DOM.studentTotalLectures.textContent = stats.total;

    // Render upcoming activities (Max 2 for simple dashboard timeline preview)
    const activities = DB.getActivities();
    const upcomingContainer = DOM.studentDashboardActivities;
    upcomingContainer.innerHTML = '';

    const todayStr = getLocalDateString();
    const upcoming = activities.filter(a => a.Date >= todayStr).slice(0, 2);

    if (upcoming.length === 0) {
      upcomingContainer.innerHTML = `
        <div class="empty-state" style="padding: 1rem 0;">
          <p><i class="fa-solid fa-calendar-xmark" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>No upcoming activities scheduled.</p>
        </div>
      `;
    } else {
      upcoming.forEach((act, idx) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${idx === 0 ? 'active' : ''}`;
        
        // Find Organizer Name
        const organizer = DB.getFacultyMember(act.OrganizedBy);
        const orgName = organizer ? organizer.Name : 'Faculty';

        item.innerHTML = `
          <div class="timeline-date">${formatReadableDate(act.Date)}</div>
          <div class="timeline-card">
            <h3>${escapeHTML(act.Title)}</h3>
            <p>${escapeHTML(act.Description)}</p>
            <div class="timeline-meta">
              <i class="fa-solid fa-chalkboard-user"></i>
              <span>By ${escapeHTML(orgName)}</span>
            </div>
          </div>
        `;
        upcomingContainer.appendChild(item);
      });
    }
  };

  // View All Button in student dashboard triggers Activity panel redirection
  DOM.studentViewAllActivitiesBtn.addEventListener('click', () => {
    switchView('student-activities');
  });

  const refreshStudentActivities = () => {
    const activities = DB.getActivities();
    const listContainer = DOM.studentActivitiesList;
    listContainer.innerHTML = '';

    if (activities.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-calendar-minus"></i>
          <p>No college activities are currently scheduled.</p>
        </div>
      `;
      return;
    }

    const todayStr = getLocalDateString();
    
    activities.forEach(act => {
      const item = document.createElement('div');
      const isUpcoming = act.Date >= todayStr;
      item.className = `timeline-item ${isUpcoming ? 'active' : ''}`;
      
      const organizer = DB.getFacultyMember(act.OrganizedBy);
      const orgName = organizer ? organizer.Name : 'Faculty';

      item.innerHTML = `
        <div class="timeline-date">${formatReadableDate(act.Date)} ${isUpcoming ? '<span class="badge badge-success" style="margin-left: 0.5rem; padding: 0.15rem 0.4rem; font-size: 0.6rem;">Upcoming</span>' : ''}</div>
        <div class="timeline-card">
          <h3>${escapeHTML(act.Title)}</h3>
          <p>${escapeHTML(act.Description)}</p>
          <div class="timeline-meta">
            <i class="fa-solid fa-user-check"></i>
            <span>Coordinator: ${escapeHTML(orgName)}</span>
          </div>
        </div>
      `;
      listContainer.appendChild(item);
    });
  };

  // ==========================================================================
  // FACULTY DASHBOARD CONTROLLERS
  // ==========================================================================
  const refreshFacultyDashboard = () => {
    DOM.facultyWelcomeTitle.textContent = `Welcome back, ${currentUser.name}!`;

    // Overview Stats
    const students = DB.getStudents();
    DOM.facultyStatStudents.textContent = students.length;

    // Average attendance rate across all students
    let sum = 0;
    let counted = 0;
    students.forEach(s => {
      const stats = Reports.getStudentStats(s.StudentID);
      if (stats.total > 0) {
        sum += stats.percentage;
        counted++;
      }
    });
    const avgAttendance = counted > 0 ? Math.round(sum / counted) : 0;
    DOM.facultyStatAttendance.textContent = `${avgAttendance}%`;

    // Activities Count
    const activities = DB.getActivities();
    DOM.facultyStatActivities.textContent = activities.length;
  };

  // Bind quick action control buttons
  DOM.facultyQuickAttendanceBtn.addEventListener('click', () => switchView('faculty-attendance'));
  DOM.facultyQuickActivityBtn.addEventListener('click', () => switchView('faculty-activities'));
  DOM.facultyQuickReportsBtn.addEventListener('click', () => switchView('reports'));

  // ==========================================================================
  // FACULTY ATTENDANCE RECORDING CONTROLLERS
  // ==========================================================================
  const refreshFacultyAttendanceTab = () => {
    const selectedDate = DOM.attendanceDateSelect.value;
    const selectedDept = DOM.attendanceDeptSelect.value;
    const selectedYear = DOM.attendanceYearSelect.value;

    // Filter student list
    let students = DB.getStudents();
    if (selectedDept !== 'All') {
      students = students.filter(s => s.Department === selectedDept);
    }
    if (selectedYear !== 'All') {
      students = students.filter(s => s.Year === selectedYear);
    }

    // Query existing logs for selected date
    const existingLogs = DB.getAttendance(null, selectedDate);
    const logsMap = {}; // Maps studentID to Status
    existingLogs.forEach(log => {
      logsMap[log.StudentID] = log.Status;
    });

    const tbody = DOM.attendanceStudentsBody;
    tbody.innerHTML = '';

    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            No students found matching current filters.
          </td>
        </tr>
      `;
      DOM.attendanceSaveBtn.disabled = true;
      return;
    }

    DOM.attendanceSaveBtn.disabled = false;

    students.forEach(student => {
      const row = document.createElement('tr');
      
      // Default state: check if pre-existing, otherwise default to Present
      const status = logsMap[student.StudentID] || 'Present';
      const isPresentChecked = status === 'Present' ? 'checked' : '';
      const isAbsentChecked = status === 'Absent' ? 'checked' : '';

      row.innerHTML = `
        <td><strong>${student.StudentID}</strong></td>
        <td>${escapeHTML(student.Name)}</td>
        <td><span class="badge badge-primary">${student.Department}</span></td>
        <td>${student.Year}</td>
        <td style="text-align: center;">
          <div class="status-switch-group">
            <label class="status-switch-label">
              <input type="radio" name="status-${student.StudentID}" value="Present" ${isPresentChecked}>
              <i class="fa-solid fa-circle-check"></i> Present
            </label>
            <label class="status-switch-label">
              <input type="radio" name="status-${student.StudentID}" value="Absent" ${isAbsentChecked}>
              <i class="fa-solid fa-circle-xmark"></i> Absent
            </label>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    DOM.attendanceSaveStatus.textContent = existingLogs.length > 0 
      ? `✏️ Editing saved attendance for this date (${existingLogs.length} logs found)`
      : '🆕 Unsaved attendance for this date';
    DOM.attendanceSaveStatus.style.color = existingLogs.length > 0 ? 'var(--warning)' : 'var(--text-muted)';
  };

  // Triggers when filter parameters changes
  DOM.attendanceDateSelect.addEventListener('change', refreshFacultyAttendanceTab);
  DOM.attendanceDeptSelect.addEventListener('change', refreshFacultyAttendanceTab);
  DOM.attendanceYearSelect.addEventListener('change', refreshFacultyAttendanceTab);

  // Bulk Quick Mark buttons
  DOM.attendanceMarkAllPresent.addEventListener('click', () => {
    const radios = DOM.attendanceStudentsBody.querySelectorAll('input[value="Present"]');
    radios.forEach(r => r.checked = true);
    showToast('All listed marked Present', 'warning');
  });

  DOM.attendanceMarkAllAbsent.addEventListener('click', () => {
    const radios = DOM.attendanceStudentsBody.querySelectorAll('input[value="Absent"]');
    radios.forEach(r => r.checked = true);
    showToast('All listed cleared/marked Absent', 'warning');
  });

  // Save Attendance form submission
  DOM.attendanceSaveBtn.addEventListener('click', () => {
    const date = DOM.attendanceDateSelect.value;
    if (!date) {
      showToast('Please select a valid date.', 'danger');
      return;
    }

    const rows = DOM.attendanceStudentsBody.querySelectorAll('tr');
    const recordsList = [];

    rows.forEach(row => {
      const studentIdElement = row.querySelector('td strong');
      if (!studentIdElement) return; // Skip empty message rows
      const studentId = studentIdElement.textContent;
      
      const checkedRadio = row.querySelector(`input[name="status-${studentId}"]:checked`);
      const status = checkedRadio ? checkedRadio.value : 'Present';

      recordsList.push({
        StudentID: studentId,
        Status: status
      });
    });

    if (recordsList.length === 0) {
      showToast('No student records to save.', 'danger');
      return;
    }

    // Save to Local DB
    DB.saveAttendance(date, recordsList);
    showToast(`Attendance saved successfully for ${formatReadableDate(date)}`, 'success');
    refreshFacultyAttendanceTab();
  });

  // ==========================================================================
  // FACULTY ACTIVITIES MANAGEMENT CONTROLLERS
  // ==========================================================================
  const refreshFacultyActivitiesTab = () => {
    const activities = DB.getActivities();
    const container = DOM.facultyActivitiesList;
    container.innerHTML = '';

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>No activities scheduled yet.</p>
        </div>
      `;
      return;
    }

    const todayStr = getLocalDateString();

    activities.forEach(act => {
      const item = document.createElement('div');
      const isUpcoming = act.Date >= todayStr;
      item.className = `timeline-item ${isUpcoming ? 'active' : ''}`;
      
      item.innerHTML = `
        <div class="timeline-date">
          ${formatReadableDate(act.Date)}
          <span style="float: right;">
            <button class="btn btn-danger delete-activity-btn" data-id="${act.ActivityID}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </span>
        </div>
        <div class="timeline-card">
          <h3>${escapeHTML(act.Title)}</h3>
          <p>${escapeHTML(act.Description)}</p>
        </div>
      `;
      container.appendChild(item);
    });

    // Attach click listeners to all delete buttons
    container.querySelectorAll('.delete-activity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this activity?')) {
          DB.deleteActivity(id);
          showToast('Activity deleted successfully', 'success');
          refreshFacultyActivitiesTab();
        }
      });
    });
  };

  // Add new activity submit
  DOM.activityCreateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = DOM.activityTitle.value.trim();
    const date = DOM.activityDate.value;
    const desc = DOM.activityDescription.value.trim();

    if (!title || !date || !desc) {
      showToast('Please fill out all activity fields.', 'danger');
      return;
    }

    DB.addActivity(title, desc, date, currentUser.id);
    showToast('Activity scheduled and published!', 'success');
    
    // Clear Form
    DOM.activityTitle.value = '';
    DOM.activityDescription.value = '';
    // Keep date at today's default
    DOM.activityDate.value = getLocalDateString();
    
    refreshFacultyActivitiesTab();
  });

  // ==========================================================================
  // REPORTS LEDGER CONTROLLERS
  // ==========================================================================
  const refreshReportsTab = () => {
    const searchVal = DOM.reportFilterSearch.value.toLowerCase().trim();
    const selectedDept = DOM.reportFilterDept.value;
    const selectedYear = DOM.reportFilterYear.value;

    let students = DB.getStudents();

    // If logged in student, they should only see their own row in summary table
    if (currentUser.role === 'student') {
      // Hide search and filter bars for students as they can only see their own report
      document.querySelector('.report-filter-bar').style.display = 'none';
      students = students.filter(s => s.StudentID === currentUser.id);
    } else {
      document.querySelector('.report-filter-bar').style.display = 'flex';
      
      // Apply filters for Faculty
      if (selectedDept !== 'All') {
        students = students.filter(s => s.Department === selectedDept);
      }
      if (selectedYear !== 'All') {
        students = students.filter(s => s.Year === selectedYear);
      }
      if (searchVal) {
        students = students.filter(s => 
          s.Name.toLowerCase().includes(searchVal) || 
          s.StudentID.toLowerCase().includes(searchVal)
        );
      }
    }

    // Populate Report summary Table
    const tbody = DOM.reportSummaryBody;
    tbody.innerHTML = '';
    
    DOM.reportRecordsCount.textContent = `${students.length} Student${students.length !== 1 ? 's' : ''}`;

    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">
            No student match reports criteria.
          </td>
        </tr>
      `;
      // Draw blank charts
      Reports.drawStudentChart('student-attendance-chart', []);
      Reports.drawDepartmentChart('dept-attendance-chart');
      return;
    }

    students.forEach(student => {
      const stats = Reports.getStudentStats(student.StudentID);
      const row = document.createElement('tr');

      let badgeClass = 'badge-danger';
      if (stats.percentage >= 75) badgeClass = 'badge-success';
      else if (stats.percentage >= 60) badgeClass = 'badge-warning';

      row.innerHTML = `
        <td><strong>${student.StudentID}</strong></td>
        <td>${escapeHTML(student.Name)}</td>
        <td><span class="badge badge-primary">${student.Department}</span></td>
        <td>${student.Year}</td>
        <td style="text-align: center; font-weight: 600; color: var(--success);">${stats.present}</td>
        <td style="text-align: center; font-weight: 600; color: var(--danger);">${stats.absent}</td>
        <td style="text-align: center; color: var(--text-muted);">${stats.total}</td>
        <td style="text-align: right;">
          <span class="badge ${badgeClass}">${stats.percentage}%</span>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Re-draw canvas figures
    Reports.drawDepartmentChart('dept-attendance-chart');
    Reports.drawStudentChart('student-attendance-chart', students);
  };

  // Bind report filter controls
  DOM.reportFilterSearch.addEventListener('input', refreshReportsTab);
  DOM.reportFilterDept.addEventListener('change', refreshReportsTab);
  DOM.reportFilterYear.addEventListener('change', refreshReportsTab);

  // Print Report Button
  DOM.reportsPrintBtn.addEventListener('click', () => {
    window.print();
  });

  // ==========================================================================
  // Helper / Utility Functions
  // ==========================================================================
  
  // Format dates elegantly, e.g. "Jun 14, 2026"
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC' // Keep date exact to date picker value
    });
  };

  // Minimal HTML Sanitizer to prevent HTML injection errors
  const escapeHTML = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // ==========================================================================
  // Bootstrapping App Check
  // ==========================================================================
  initTheme();
  
  // Check if session was already active in this window
  const activeUser = Auth.getCurrentUser();
  if (activeUser) {
    currentUser = activeUser;
    bootstrapApp();
  }
});
