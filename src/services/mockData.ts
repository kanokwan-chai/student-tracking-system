import type { User, Student, Subject, Enrollment, Assignment, Submission, Attendance, Announcement, ScoreSummary } from '../models/types';

const MOCK_USERS: User[] = [
  { id: '1', username: 'student1', role: 'student', name: 'นายเรียนดี ขยันยิ่ง' },
  { id: '2', username: 'teacher1', role: 'teacher', name: 'ครูสมใจ สอนดี' }
];

const MOCK_STUDENTS: Student[] = [
  { student_id: '1', name: 'นายเรียนดี ขยันยิ่ง', class_id: 'ปวช.1/1' },
  { student_id: 's2', name: 'นางสาวตั้งใจ เรียนเก่ง', class_id: 'ปวช.1/1' }
];

const MOCK_SUBJECTS: Subject[] = [
  { subject_id: 'sub1', name: 'การสร้างเว็บไซต์', teacher_id: '2' },
  { subject_id: 'sub2', name: 'โปรแกรมตารางคำนวณ', teacher_id: '2' },
];

const MOCK_ENROLLMENTS: Enrollment[] = [
  { student_id: '1', subject_id: 'sub1' },
  { student_id: '1', subject_id: 'sub2' },
  { student_id: 's2', subject_id: 'sub1' }
];

const MOCK_ASSIGNMENTS: Assignment[] = [
  { assignment_id: 'a1', subject_id: 'sub1', title: 'ออกแบบหน้า Home', assign_date: '2023-11-01', due_date: '2023-11-10', max_score: 10 },
  { assignment_id: 'a2', subject_id: 'sub1', title: 'เขียนโค้ด HTML', assign_date: '2023-11-12', due_date: '2023-11-20', max_score: 20 },
  { assignment_id: 'a3', subject_id: 'sub2', title: 'สรุปสูตร Excel', assign_date: '2023-11-15', due_date: '2023-11-25', max_score: 15 },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { assignment_id: 'a1', student_id: '1', status: 'submitted', score: 9, feedback: 'ทำได้ดีมาก' },
  { assignment_id: 'a2', student_id: '1', status: 'missing', score: null },
  { assignment_id: 'a3', student_id: '1', status: 'late', score: 12, feedback: 'ส่งช้าโดนหักคะแนน' },
];

const MOCK_ATTENDANCES: Attendance[] = [
  { student_id: '1', subject_id: 'sub1', date: '2023-11-01', status: 'present' },
  { student_id: '1', subject_id: 'sub1', date: '2023-11-08', status: 'late' },
  { student_id: '1', subject_id: 'sub2', date: '2023-11-02', status: 'absent' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann1', title: 'แจ้งวันหยุดนักขัตฤกษ์', detail: 'โรงเรียนหยุดทำการในวันที่ 5 ธันวาคม', date: '2023-12-01' },
  { id: 'ann2', title: 'ส่งงานโปรเจกต์', detail: 'ให้นักเรียนส่งงานก่อนเที่ยงคืน', subject_id: 'sub1', date: '2023-11-18', due_date: '2023-11-20' }
];

const MOCK_SCORE_SUMMARY: ScoreSummary[] = [
  { student_id: '1', subject_id: 'sub1', assignments_score: 25, quiz_score: 16, midterm_score: 17, behavior_score: 9, final_score: 16, total_score: 83 }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  login: async (username: string, password: string):Promise<User> => {
    await delay(500);
    const user = MOCK_USERS.find(u => u.username === username);
    if (user && password === '1234') {
      return user;
    }
    throw new Error('รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง');
  },
  
  getStudentDashboard: async (studentId: string) => {
    await delay(300);
    const student = MOCK_STUDENTS.find(s => s.student_id === studentId);
    if (!student) throw new Error('Student not found');

    const enrolledSubjectIds = MOCK_ENROLLMENTS.filter(e => e.student_id === studentId).map(e => e.subject_id);
    const subjects = MOCK_SUBJECTS.filter(s => enrolledSubjectIds.includes(s.subject_id));
    
    // Calculate stats
    const studentSubmissions = MOCK_SUBMISSIONS.filter(s => s.student_id === studentId);
    const missingAssignments = studentSubmissions.filter(s => s.status === 'missing').length;
    const studentAttendances = MOCK_ATTENDANCES.filter(a => a.student_id === studentId);
    const lateCount = studentAttendances.filter(a => a.status === 'late').length;
    const absentCount = studentAttendances.filter(a => a.status === 'absent').length;

    return {
      student,
      subjectsCount: subjects.length,
      missingAssignments,
      lateCount,
      absentCount
    };
  },

  getStudentSubjects: async (studentId: string) => {
    await delay(300);
    const enrolledSubjectIds = MOCK_ENROLLMENTS.filter(e => e.student_id === studentId).map(e => e.subject_id);
    return MOCK_SUBJECTS.filter(s => enrolledSubjectIds.includes(s.subject_id));
  },

  getStudentAssignments: async (studentId: string) => {
    await delay(300);
    const enrolledSubjectIds = MOCK_ENROLLMENTS.filter(e => e.student_id === studentId).map(e => e.subject_id);
    const assignments = MOCK_ASSIGNMENTS.filter(a => enrolledSubjectIds.includes(a.subject_id));
    
    return assignments.map(a => {
      const submission = MOCK_SUBMISSIONS.find(s => s.assignment_id === a.assignment_id && s.student_id === studentId);
      return {
        ...a,
        subject: MOCK_SUBJECTS.find(s => s.subject_id === a.subject_id)?.name || '',
        status: submission?.status || 'upcoming',
        score: submission?.score || null,
        feedback: submission?.feedback || ''
      };
    });
  },

  getTeacherSubjects: async (teacherId: string) => {
    await delay(200);
    return MOCK_SUBJECTS.filter(s => s.teacher_id === teacherId);
  },

  getTeacherDashboard: async (subjectId: string, classId: string) => {
    await delay(300);
    // Find students in this class who are enrolled in this subject
    const studentsInClass = MOCK_STUDENTS.filter(s => s.class_id === classId);
    const enrollments = MOCK_ENROLLMENTS.filter(e => e.subject_id === subjectId);
    const enrolledStudentIds = enrollments.map(e => e.student_id);
    
    const students = studentsInClass.filter(s => enrolledStudentIds.includes(s.student_id));
    
    let totalScore = 0;
    let maxScore = 0;
    let minScore = 100;
    let totalMissing = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    const studentsData = students.map(student => {
      // Submissions for this subject
      const subjectAssignments = MOCK_ASSIGNMENTS.filter(a => a.subject_id === subjectId);
      const assignmentIds = subjectAssignments.map(a => a.assignment_id);
      
      const missingCount = MOCK_SUBMISSIONS.filter(sub => sub.student_id === student.student_id && assignmentIds.includes(sub.assignment_id) && sub.status === 'missing').length;
      totalMissing += missingCount;

      // Attendance
      const attendances = MOCK_ATTENDANCES.filter(a => a.student_id === student.student_id && a.subject_id === subjectId);
      const presentCount = attendances.filter(a => a.status === 'present').length;
      const absentCount = attendances.filter(a => a.status === 'absent').length;
      const lateCount = attendances.filter(a => a.status === 'late').length;
      
      totalAbsent += absentCount;
      totalLate += lateCount;

      // Score
      const scoreSummary = MOCK_SCORE_SUMMARY.find(s => s.student_id === student.student_id && s.subject_id === subjectId);
      const sScore = scoreSummary?.total_score || 0;
      totalScore += sScore;
      if (sScore > maxScore) maxScore = sScore;
      if (sScore < minScore) minScore = sScore;

      return {
        ...student,
        missingCount,
        presentCount,
        absentCount,
        lateCount,
        leaveBusinessCount: 0,
        leaveSickCount: 0,
        scoreTasks: sScore ? (sScore * 0.3).toFixed(0) : '-',
        scoreQuizzes: sScore ? (sScore * 0.2).toFixed(0) : '-',
        scoreBehavior: sScore ? (sScore * 0.2).toFixed(0) : '-',
        scoreFinal: sScore ? (sScore * 0.3).toFixed(0) : '-',
        grade: sScore >= 80 ? '4' : (sScore >= 70 ? '3' : '2'),
        attendanceDetails: [],
        taskDetails: [],
        totalScore: sScore
      };
    });

    const avgScore = students.length > 0 ? (totalScore / students.length).toFixed(2) : 0;
    if (students.length === 0) {
      minScore = 0;
      maxScore = 0;
    }

    return {
      stats: {
        studentCount: students.length,
        totalMissing,
        totalAbsent,
        totalLate,
        avgScore,
        maxScore,
        minScore
      },
      students: studentsData
    };
  }
};
