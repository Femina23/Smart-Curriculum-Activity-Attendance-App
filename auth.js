/**
 * auth.js
 * Authentication manager for Smart Curriculum Activity & Attendance App
 */

const Auth = (() => {
  const SESSION_KEY = 'scaa_session';

  return {
    /**
     * Attempt login using Student ID or Faculty ID
     * @param {string} userId - User ID (e.g. S101, F201)
     * @returns {object|null} The session user object or null if invalid
     */
    login: (userId) => {
      if (!userId) return null;
      
      const cleanId = userId.trim();
      
      // Determine if student or faculty by prefix
      if (cleanId.toUpperCase().startsWith('S')) {
        const student = DB.getStudent(cleanId);
        if (student) {
          const sessionUser = {
            role: 'student',
            id: student.StudentID,
            name: student.Name,
            details: student
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
          return sessionUser;
        }
      } else if (cleanId.toUpperCase().startsWith('F')) {
        const faculty = DB.getFacultyMember(cleanId);
        if (faculty) {
          const sessionUser = {
            role: 'faculty',
            id: faculty.FacultyID,
            name: faculty.Name,
            details: faculty
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
          return sessionUser;
        }
      }
      
      return null; // Return null if user ID is not found or is invalid
    },

    /**
     * Check if a user session exists
     * @returns {boolean} True if logged in
     */
    isLoggedIn: () => {
      return localStorage.getItem(SESSION_KEY) !== null;
    },

    /**
     * Get details of currently logged-in user
     * @returns {object|null} Session details
     */
    getCurrentUser: () => {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    },

    /**
     * Log out current user and clear session
     */
    logout: () => {
      localStorage.removeItem(SESSION_KEY);
      return true;
    }
  };
})();
