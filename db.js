/**
 * db.js
 * local Storage Database Manager for Smart Curriculum Activity & Attendance App
 */

const DB = (() => {
  // Key names in LocalStorage
  const KEYS = {
    STUDENTS: 'scaa_students',
    FACULTY: 'scaa_faculty',
    ATTENDANCE: 'scaa_attendance',
    ACTIVITIES: 'scaa_activities',
    INITIALIZED: 'scaa_initialized'
  };

  // Seed Data
  const seedStudents = [
    { StudentID: 'S101', Name: 'Aravind Sharma', Department: 'Computer Science', Year: '3rd Year', Email: 'aravind@college.edu' },
    { StudentID: 'S102', Name: 'Bhavya Patel', Department: 'Computer Science', Year: '3rd Year', Email: 'bhavya@college.edu' },
    { StudentID: 'S103', Name: 'Chirag Sen', Department: 'Information Technology', Year: '2nd Year', Email: 'chirag@college.edu' },
    { StudentID: 'S104', Name: 'Divya Nair', Department: 'Information Technology', Year: '2nd Year', Email: 'divya@college.edu' },
    { StudentID: 'S105', Name: 'Eshwar Rao', Department: 'Mechanical Engineering', Year: '4th Year', Email: 'eshwar@college.edu' },
    { StudentID: 'S106', Name: 'Fathima R.', Department: 'Electronics Engineering', Year: '3rd Year', Email: 'fathima@college.edu' }
  ];

  const seedFaculty = [
    { FacultyID: 'F201', Name: 'Dr. Ramesh Prasad', Email: 'ramesh@college.edu' },
    { FacultyID: 'F202', Name: 'Prof. Sneha Iyer', Email: 'sneha@college.edu' }
  ];

  const seedActivities = [
    {
      ActivityID: 'ACT001',
      Title: 'National Hackathon Prep',
      Description: 'Team formation, theme brainstorming, and technical mentorship guidelines for the upcoming Smart India Hackathon.',
      Date: '2026-06-15',
      OrganizedBy: 'F201'
    },
    {
      ActivityID: 'ACT002',
      Title: 'Guest Lecture: AI Ethics & Safety',
      Description: 'A seminar discussing regulatory frameworks, AI safety alignment, and the societal impact of large language models.',
      Date: '2026-06-18',
      OrganizedBy: 'F202'
    },
    {
      ActivityID: 'ACT003',
      Title: 'Robot Combat Workshop',
      Description: 'Learn mechanical design, ESC speed controller configuration, and weapon integration in our lab.',
      Date: '2026-06-22',
      OrganizedBy: 'F201'
    }
  ];

  // Helper to generate seed attendance records for the past 5 days
  const generateSeedAttendance = () => {
    const records = [];
    const dates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];
    let idCounter = 1;

    dates.forEach(date => {
      seedStudents.forEach(student => {
        // Give students a slightly different attendance profile
        let status = 'Present';
        if (student.StudentID === 'S101' && date === '2026-06-09') status = 'Absent';
        if (student.StudentID === 'S103' && (date === '2026-06-10' || date === '2026-06-11')) status = 'Absent';
        if (student.StudentID === 'S105' && date === '2026-06-08') status = 'Absent';
        // S106 is always present, S104 has 1 absent
        if (student.StudentID === 'S104' && date === '2026-06-12') status = 'Absent';

        records.push({
          AttendanceID: 'ATT' + String(idCounter++).padStart(3, '0'),
          StudentID: student.StudentID,
          Date: date,
          Status: status
        });
      });
    });

    return records;
  };

  // Init method to load seed data if not initialized
  const init = () => {
    if (!localStorage.getItem(KEYS.INITIALIZED)) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(seedStudents));
      localStorage.setItem(KEYS.FACULTY, JSON.stringify(seedFaculty));
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(generateSeedAttendance()));
      localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(seedActivities));
      localStorage.setItem(KEYS.INITIALIZED, 'true');
      console.log('SCAA Local Database seeded successfully!');
    }
  };

  // Helper to read from LS
  const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];

  // Helper to write to LS
  const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  // Expose API
  return {
    init,

    // Students CRUD
    getStudents: () => getData(KEYS.STUDENTS),
    getStudent: (id) => getData(KEYS.STUDENTS).find(s => s.StudentID.toLowerCase() === id.trim().toLowerCase()),

    // Faculty CRUD
    getFaculty: () => getData(KEYS.FACULTY),
    getFacultyMember: (id) => getData(KEYS.FACULTY).find(f => f.FacultyID.toLowerCase() === id.trim().toLowerCase()),

    // Attendance Operations
    getAttendance: (studentId = null, date = null) => {
      let records = getData(KEYS.ATTENDANCE);
      if (studentId) {
        records = records.filter(r => r.StudentID.toLowerCase() === studentId.trim().toLowerCase());
      }
      if (date) {
        records = records.filter(r => r.Date === date);
      }
      return records;
    },

    saveAttendance: (date, list) => {
      // list should be an array of: { StudentID, Status }
      const records = getData(KEYS.ATTENDANCE);
      let idCounter = records.length > 0
        ? Math.max(...records.map(r => parseInt(r.AttendanceID.replace('ATT', '')))) + 1
        : 1;

      // Filter out existing records for this date to allow editing/re-saving
      const filteredRecords = records.filter(r => r.Date !== date);

      list.forEach(item => {
        filteredRecords.push({
          AttendanceID: 'ATT' + String(idCounter++).padStart(3, '0'),
          StudentID: item.StudentID,
          Date: date,
          Status: item.Status
        });
      });

      setData(KEYS.ATTENDANCE, filteredRecords);
      return true;
    },

    // Activities Operations
    getActivities: () => {
      const activities = getData(KEYS.ACTIVITIES);
      // Sort by date descending/ascending
      return activities.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    },

    addActivity: (title, description, date, facultyId) => {
      const activities = getData(KEYS.ACTIVITIES);
      const idCounter = activities.length > 0
        ? Math.max(...activities.map(a => parseInt(a.ActivityID.replace('ACT', '')))) + 1
        : 1;

      const newActivity = {
        ActivityID: 'ACT' + String(idCounter).padStart(3, '0'),
        Title: title,
        Description: description,
        Date: date,
        OrganizedBy: facultyId
      };

      activities.push(newActivity);
      setData(KEYS.ACTIVITIES, activities);
      return newActivity;
    },

    deleteActivity: (activityId) => {
      let activities = getData(KEYS.ACTIVITIES);
      activities = activities.filter(a => a.ActivityID !== activityId);
      setData(KEYS.ACTIVITIES, activities);
      return true;
    },

    // Reset DB helper
    resetDatabase: () => {
      localStorage.removeItem(KEYS.STUDENTS);
      localStorage.removeItem(KEYS.FACULTY);
      localStorage.removeItem(KEYS.ATTENDANCE);
      localStorage.removeItem(KEYS.ACTIVITIES);
      localStorage.removeItem(KEYS.INITIALIZED);
      init();
    }
  };
})();

// Initialize immediately
DB.init();
