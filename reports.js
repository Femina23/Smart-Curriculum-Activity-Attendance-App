/**
 * reports.js
 * Reports computing and Custom High-DPI Canvas Charting Engine
 */

const Reports = (() => {

  /**
   * Calculate statistics for a single student
   * @param {string} studentId 
   * @returns {object} { present, absent, total, percentage }
   */
  const getStudentStats = (studentId) => {
    const logs = DB.getAttendance(studentId);
    const total = logs.length;
    if (total === 0) {
      return { present: 0, absent: 0, total: 0, percentage: 0 };
    }
    const present = logs.filter(l => l.Status === 'Present').length;
    const absent = total - present;
    const percentage = Math.round((present / total) * 100);
    return { present, absent, total, percentage };
  };

  /**
   * Get average attendance for a department
   * @param {string} dept 
   * @returns {number} Average attendance percentage
   */
  const getDepartmentAverage = (dept) => {
    const students = DB.getStudents().filter(s => dept === 'All' || s.Department === dept);
    if (students.length === 0) return 0;

    let totalPercentageSum = 0;
    let validStudentsCount = 0;

    students.forEach(s => {
      const stats = getStudentStats(s.StudentID);
      if (stats.total > 0) {
        totalPercentageSum += stats.percentage;
        validStudentsCount++;
      }
    });

    return validStudentsCount > 0 ? Math.round(totalPercentageSum / validStudentsCount) : 0;
  };

  /**
   * Helper to scale Canvas for High-DPI/Retina screens (removes blur)
   */
  const setupCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    const width = rect.width || parseFloat(canvas.getAttribute('width')) || 350;
    const height = rect.height || parseFloat(canvas.getAttribute('height')) || 220;
    
    // Set actual buffer size scaled by device pixel ratio
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Scale drawings so they look matching the CSS sizes
    ctx.scale(dpr, dpr);
    
    return { ctx, width, height };
  };

  /**
   * Custom Draw: Department Column Chart (Vertical Bars)
   */
  const drawDepartmentChart = (canvasId) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    
    const depts = [
      'Computer Science',
      'Information Technology',
      'Mechanical Engineering',
      'Electronics Engineering'
    ];

    const averages = depts.map(d => ({
      name: d.split(' ')[0], // CS, IT, Mech, Elec shorthand
      fullName: d,
      value: getDepartmentAverage(d)
    }));

    // Chart margins
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Detect theme colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const labelColor = isDark ? '#f3f4f6' : '#111827';
    
    // Draw Y Axis Gridlines & Labels (0, 25, 50, 75, 100%)
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = [0, 25, 50, 75, 100];
    yTicks.forEach(tick => {
      const y = paddingTop + chartHeight - (tick / 100) * chartHeight;
      // Draw gridline
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Label
      ctx.fillText(tick + '%', paddingLeft - 8, y);
    });

    // Draw Columns
    const barWidth = Math.min(45, chartWidth / averages.length - 20);
    const colSpacing = chartWidth / averages.length;

    averages.forEach((item, index) => {
      const x = paddingLeft + (index * colSpacing) + (colSpacing - barWidth) / 2;
      const barHeight = (item.value / 100) * chartHeight;
      const y = paddingTop + chartHeight - barHeight;

      // Create vertical gradient
      const gradient = ctx.createLinearGradient(x, y, x, paddingTop + chartHeight);
      gradient.addColorStop(0, '#8b5cf6'); // Primary purple
      gradient.addColorStop(1, '#06b6d4'); // Accent cyan

      // Draw rounded rectangle bar
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Round top corners
      const r = 6; // corner radius
      if (barHeight > r) {
        ctx.roundRect(x, y, barWidth, barHeight, [r, r, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();

      // Draw Value text on top of bar
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.value + '%', x + barWidth / 2, y - 8);

      // Draw X Label
      ctx.fillStyle = textColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(item.name, x + barWidth / 2, paddingTop + chartHeight + 16);
    });
  };

  /**
   * Custom Draw: Student Horizontal Bar Chart
   */
  const drawStudentChart = (canvasId, studentsList) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);

    // Limit to top 5 students for display spacing
    const topStudents = studentsList.slice(0, 5).map(s => ({
      name: s.Name.split(' ')[0] + ' ' + (s.Name.split(' ')[1] ? s.Name.split(' ')[1][0] + '.' : ''),
      value: getStudentStats(s.StudentID).percentage
    }));

    if (topStudents.length === 0) {
      // Draw empty placeholder text
      ctx.fillStyle = '#6b7280';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No student data matching filters', width / 2, height / 2);
      return;
    }

    const paddingLeft = 95;
    const paddingRight = 45;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const labelColor = isDark ? '#f3f4f6' : '#111827';

    // Draw Vertical Gridlines at 0, 25, 50, 75, 100%
    const ticks = [0, 25, 50, 75, 100];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = textColor;

    ticks.forEach(tick => {
      const x = paddingLeft + (tick / 100) * chartWidth;
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Axis label at bottom
      ctx.fillText(tick + '%', x, height - 4);
    });

    // Draw Rows
    const rowHeight = chartHeight / topStudents.length;
    const barHeight = Math.min(18, rowHeight - 8);

    topStudents.forEach((student, index) => {
      const y = paddingTop + (index * rowHeight) + (rowHeight - barHeight) / 2;
      const barWidth = (student.value / 100) * chartWidth;

      // Horizontal Gradient
      const gradient = ctx.createLinearGradient(paddingLeft, y, paddingLeft + barWidth, y);
      gradient.addColorStop(0, '#06b6d4'); // Cyan
      gradient.addColorStop(1, '#10b981'); // Emerald

      // Draw Bar
      ctx.fillStyle = gradient;
      ctx.beginPath();
      const r = 4; // corner radius
      if (barWidth > r) {
        ctx.roundRect(paddingLeft, y, barWidth, barHeight, [0, r, r, 0]);
      } else {
        ctx.rect(paddingLeft, y, barWidth, barHeight);
      }
      ctx.fill();

      // Label (Student Name) on Left Axis
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(student.name, paddingLeft - 8, y + barHeight / 2);

      // Value text on Right of Bar
      ctx.fillStyle = student.value >= 75 ? '#10b981' : (student.value >= 50 ? '#f59e0b' : '#ef4444');
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(student.value + '%', paddingLeft + barWidth + 8, y + barHeight / 2);
    });
  };

  return {
    getStudentStats,
    getDepartmentAverage,
    drawDepartmentChart,
    drawStudentChart
  };
})();
