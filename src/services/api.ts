import { mockApi } from './mockData';
import type { Role } from '../models/types';
import { fetchSheetData, SHEET_IDS } from './googleSheets';

// To switch to LIVE Google Sheets, change this flag to false
const USE_MOCK = false;

// Helper to fetch subject specific tab with candidate names
const fetchSubjectTab = async (targetSheetId: string, subjName: string, classId: string, tabSuffix: string) => {
  const roomShort = (classId || '').replace('ปวช.', '').trim();
  const candidates = [
    `${subjName}_${tabSuffix}`,
    `${subjName}_${roomShort}_${tabSuffix}`,
    `${subjName}_${classId}_${tabSuffix}`,
    tabSuffix
  ];

  for (const tab of candidates) {
    try {
      const data = await fetchSheetData(targetSheetId, tab);
      if (data && data.length > 0) {
        return data;
      }
    } catch (e) {
      // try next
    }
  }
  return [];
};

// Helper to filter out summary and metadata columns
const isTaskKey = (key: string) => {
  if (!key) return false;
  const k = key.trim();
  if (
    k.includes('ลำดับ') || 
    k.includes('รวมคะแนน') || 
    k.includes('รวม') || 
    k.includes('เก็บจริง') || 
    k.includes('รหัสนักเรียน') ||
    k.includes('student_id') ||
    k.includes('ชื่อ') ||
    k.includes('นามสกุล') ||
    k.includes('ชื่อเล่น') ||
    k.includes('รหัสห้องเรียน') ||
    k.includes('ห้องเรียน') ||
    k.startsWith('Column')
  ) {
    return false;
  }
  return true;
};

export const api = {
  getAvailableSubjectsForLogin: async () => {
    try {
      const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
      const uniqueNames = Array.from(new Set(subjectsRaw.map((s: any) => s['ชื่อรายวิชา']).filter(Boolean)));
      return uniqueNames as string[];
    } catch (e) {
      return ['โครงสร้างข้อมูลและอัลกอริทึม', 'เทคโนโลยีดิจิทัลเพื่ออาชีพ', 'โปรแกรมตารางคำนวณ'];
    }
  },

  login: async (studentIdInput: string, selectedSubjectOrPassword?: string) => {
    if (USE_MOCK) return mockApi.login(studentIdInput, selectedSubjectOrPassword || '');
    
    const inputUser = String(studentIdInput).trim();

    // Check if logging in as teacher
    if (inputUser.toLowerCase() === 'teacher1' || inputUser.toLowerCase() === 'ครู' || inputUser.toLowerCase() === 'teacher') {
      const pass = String(selectedSubjectOrPassword || '').trim();
      if (pass !== '122047mail') {
        throw new Error('รหัสผ่านครูผู้สอนไม่ถูกต้อง');
      }
      return { id: 'teacher1', name: 'ครูกนกวรรณ ชัยชนะ', role: 'teacher' as Role };
    }

    // Student login: fetch master student list
    const studentsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');

    const student = studentsRaw.find((s: any) => {
      const sid = String(s['รหัสนักเรียน'] || s['student_id'] || '').trim();
      return sid === inputUser;
    });

    if (!student) {
      throw new Error(`ไม่พบรหัสนักเรียน "${inputUser}" ในระบบ กรุณาตรวจสอบรหัสประจำตัวอีกครั้ง`);
    }

    const studentName = `${student['ชื่อ'] || ''} ${student['นามสกุล'] || ''}`.trim() || `นักเรียน ${inputUser}`;

    return {
      id: String(student['รหัสนักเรียน'] || inputUser),
      name: studentName,
      role: 'student' as Role,
      selectedSubject: selectedSubjectOrPassword || ''
    };
  },

  changePassword: async (studentId: string, oldPass: string, newPass: string) => {
    const trimmedId = String(studentId).trim();
    const trimmedOld = String(oldPass).trim();
    const trimmedNew = String(newPass).trim();

    if (!trimmedNew || trimmedNew.length < 4) {
      throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
    }

    const customPass = localStorage.getItem(`custom_pass_${trimmedId}`);
    const validOld = customPass ? customPass : trimmedId;

    if (trimmedOld !== validOld) {
      throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
    }

    localStorage.setItem(`custom_pass_${trimmedId}`, trimmedNew);
    return true;
  },

  getStudentDashboard: async (studentId: string) => {
    if (USE_MOCK) return mockApi.getStudentDashboard(studentId);
    
    const studentsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');
    const studentInfo = studentsRaw.find((s: any) => String(s['รหัสนักเรียน'] || s['student_id'] || '') === String(studentId));
    
    if (!studentInfo) return mockApi.getStudentDashboard(studentId);

    const studentClass = studentInfo['ห้องเรียน'] || studentInfo['รหัสห้องเรียน'];

    const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
    const mySubjects = subjectsRaw.filter((s: any) => 
      s['ห้องเรียน'] === studentClass || 
      s['รหัสห้องเรียน'] === studentClass ||
      s['ห้องเรียน'] === studentInfo['ห้องเรียน']
    );

    let missingAssignments = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leaveBusinessCount = 0;
    let leaveSickCount = 0;

    let totalScoreSum = 0;
    let subjectScoresCount = 0;

    let attendanceDetails: { subject: string; date: string; status: string }[] = [];

    await Promise.all(mySubjects.map(async (subj: any) => {
      const targetSheetId = subj['Sheet ID'] || subj['กระดาษคำนวณ'] || subj['Link'] || SHEET_IDS[0];
      const subjName = subj['ชื่อรายวิชา'];
      const classId = subj['ห้องเรียน'] || studentClass;
      
      const [attendances, assignments, grades] = await Promise.all([
        fetchSubjectTab(targetSheetId, subjName, classId, 'เข้าเรียน'),
        fetchSubjectTab(targetSheetId, subjName, classId, 'คะแนนเก็บรายหน่วย'),
        fetchSubjectTab(targetSheetId, subjName, classId, 'ตัดเกรด')
      ]);

      const myAtt = attendances.find((a: any) => String(a['รหัสนักเรียน'] || a['student_id'] || '') === String(studentId)) || {};
      Object.keys(myAtt).forEach(key => {
        const val = String(myAtt[key] || '').trim();
        // Ignore metadata columns
        if (['เช็คชื่อเข้าเรียน ลำดับ', 'ลำดับ', 'รหัสนักเรียน', 'student_id', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'รหัสห้องเรียน', 'ห้องเรียน'].includes(key) || key.startsWith('Column')) {
          return;
        }

        if (val === 'สาย') lateCount++;
        else if (val === 'ขาด') absentCount++;
        else if (val === 'มา' || val === 'มาเรียน') presentCount++;
        else if (val.includes('ลากิจ')) leaveBusinessCount++;
        else if (val.includes('ป่วย')) leaveSickCount++;
        else if (val.includes('ลา')) leaveBusinessCount++;

        if (val && val !== 'null' && val !== 'undefined') {
          // Extract date from header
          const dateMatch = key.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
          const cleanDate = dateMatch ? dateMatch[0] : key;
          attendanceDetails.push({
            subject: subjName,
            date: cleanDate,
            status: val
          });
        }
      });

      const myTasks = assignments.find((t: any) => String(t['รหัสนักเรียน'] || t['student_id'] || '') === String(studentId)) || {};
      Object.keys(myTasks).forEach(key => {
        if (isTaskKey(key)) {
          const val = myTasks[key];
          const strVal = String(val || '').trim();
          if (val === null || val === undefined || strVal === '' || strVal === '-' || strVal === 'ไม่ส่งงาน') {
            missingAssignments++;
          }
        }
      });

      const myGrade = grades.find((g: any) => String(g['รหัสนักเรียน'] || g['student_id'] || '') === String(studentId)) || {};
      if (myGrade['คะแนนรวม (ตัดเกรด)']) {
        totalScoreSum += Number(myGrade['คะแนนรวม (ตัดเกรด)']) || 0;
        subjectScoresCount++;
      }
    }));

    return {
      student_id: String(studentId),
      name: `${studentInfo['ชื่อ'] || ''} ${studentInfo['นามสกุล'] || ''}`.trim(),
      class: studentClass,
      attendanceDetails,
      stats: {
        enrolledSubjects: mySubjects.length,
        missingAssignments,
        attendanceRate: presentCount,
        lateCount,
        absentCount,
        leaveBusinessCount,
        leaveSickCount,
        totalScore: totalScoreSum,
        avgScore: subjectScoresCount ? (totalScoreSum / subjectScoresCount).toFixed(1) : 0
      }
    };
  },

  getStudentSubjects: async (studentId: string) => {
    if (USE_MOCK) return mockApi.getStudentSubjects(studentId);

    const studentsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');
    const studentInfo = studentsRaw.find((s: any) => String(s['รหัสนักเรียน'] || s['student_id'] || '') === String(studentId));
    if (!studentInfo) return [];

    const studentClass = studentInfo['ห้องเรียน'] || studentInfo['รหัสห้องเรียน'];

    const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
    const mySubjects = subjectsRaw.filter((s: any) => 
      s['ห้องเรียน'] === studentClass || 
      s['รหัสห้องเรียน'] === studentClass ||
      s['ห้องเรียน'] === studentInfo['ห้องเรียน']
    );

    const results = await Promise.all(mySubjects.map(async (subj: any) => {
      const targetSheetId = subj['Sheet ID'] || subj['กระดาษคำนวณ'] || subj['Link'] || SHEET_IDS[0];
      const subjName = subj['ชื่อรายวิชา'];
      const classId = subj['ห้องเรียน'] || studentClass;

      const grades = await fetchSubjectTab(targetSheetId, subjName, classId, 'ตัดเกรด');
      const myGrade = grades.find((g: any) => String(g['รหัสนักเรียน'] || g['student_id'] || '') === String(studentId)) || {};

      return {
        subject_id: subj['รหัสรายวิชา'] || 'SUBJ-01',
        subject_name: subjName,
        teacher_name: subj['ครูผู้สอน'] || 'ครูกนกวรรณ ชัยชนะ',
        score_tasks: myGrade['คะแนนงานรวม 30%'] || '-',
        score_quizzes: myGrade['สอบย่อย 20%'] || '-',
        score_final: myGrade['ปลายภาค 30%'] || '-',
        score_behavior: myGrade['จิตพิสัย 20%'] || '-',
        total_score: myGrade['คะแนนรวม (ตัดเกรด)'] || '-',
        grade: myGrade['เกรด'] || '-',
        is_published: subj['สถานะ'] === 'ประกาศแล้ว' || subj['สถานะ'] === 'เผยแพร่'
      };
    }));

    return results;
  },

  getStudentAssignments: async (studentId: string) => {
    if (USE_MOCK) return mockApi.getStudentAssignments(studentId);
    
    const studentsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');
    const studentInfo = studentsRaw.find((s: any) => String(s['รหัสนักเรียน'] || s['student_id'] || '') === String(studentId));
    if (!studentInfo) return [];
    
    const studentClass = studentInfo['ห้องเรียน'] || studentInfo['รหัสห้องเรียน'];
    const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
    const mySubjects = subjectsRaw.filter((s: any) => 
      s['ห้องเรียน'] === studentClass || 
      s['รหัสห้องเรียน'] === studentClass ||
      s['ห้องเรียน'] === studentInfo['ห้องเรียน']
    );
    
    let assignmentsList: any[] = [];
    
    await Promise.all(mySubjects.map(async (subj: any) => {
      const targetSheetId = subj['Sheet ID'] || subj['กระดาษคำนวณ'] || subj['Link'] || SHEET_IDS[0];
      const subjName = subj['ชื่อรายวิชา'];
      const classId = subj['ห้องเรียน'] || studentClass;
      
      const tasks = await fetchSubjectTab(targetSheetId, subjName, classId, 'คะแนนเก็บรายหน่วย');
      const myTasks = tasks.find((t: any) => String(t['รหัสนักเรียน'] || t['student_id'] || '') === String(studentId));
      
      if (myTasks) {
         for (const key of Object.keys(myTasks)) {
           if (isTaskKey(key)) {
              const val = myTasks[key];
              const strVal = String(val || '').trim();
              const isMissing = val === null || val === undefined || strVal === '' || strVal === '-' || strVal === 'ไม่ส่งงาน';
              
              const match = key.match(/\((\d+)\)/);
              const max_score = match ? Number(match[1]) : 10;

              let cleanTitle = key;
              if (match) {
                 cleanTitle = key.replace(/\s*\(\d+\)/, '').trim();
              }

              assignmentsList.push({
                assignment_id: `${subjName}-${key}`,
                subject: subjName,
                title: cleanTitle,
                assign_date: '-',
                due_date: '-',
                max_score: max_score,
                score: isMissing ? null : val,
                status: isMissing ? 'missing' : 'submitted',
                feedback: ''
              });
           }
         }
      }
    }));

    return assignmentsList;
  },

  getStudentQuizzes: async (studentId: string) => {
    if (USE_MOCK) return [];

    const studentsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');
    const studentInfo = studentsRaw.find((s: any) => String(s['รหัสนักเรียน'] || s['student_id'] || '') === String(studentId));
    if (!studentInfo) return [];

    const studentClass = studentInfo['ห้องเรียน'] || studentInfo['รหัสห้องเรียน'];
    const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
    const mySubjects = subjectsRaw.filter((s: any) => 
      s['ห้องเรียน'] === studentClass || 
      s['รหัสห้องเรียน'] === studentClass ||
      s['ห้องเรียน'] === studentInfo['ห้องเรียน']
    );

    let quizzesResult: any[] = [];

    await Promise.all(mySubjects.map(async (subj: any) => {
      const targetSheetId = subj['Sheet ID'] || subj['กระดาษคำนวณ'] || subj['Link'] || SHEET_IDS[0];
      const subjName = subj['ชื่อรายวิชา'];
      const classId = subj['ห้องเรียน'] || studentClass;

      const quizData = await fetchSubjectTab(targetSheetId, subjName, classId, 'คะแนนสอบย่อย 20 %');
      const myRow = quizData.find((q: any) => String(q['รหัสนักเรียน'] || q['student_id'] || '') === String(studentId));

      let units: { title: string; score: any }[] = [];
      let totalScore = '-';
      let weightedScore = '-';

      if (myRow) {
        Object.keys(myRow).forEach(key => {
          if ((key.includes('หน่วย') || key.includes('หน่่วย')) && !key.includes('ลำดับ') && !key.includes('รวม') && !key.includes('คะแนนเก็บ')) {
            units.push({
              title: key,
              score: myRow[key] !== null && myRow[key] !== undefined ? myRow[key] : '-'
            });
          } else if (key === 'คะแนนรวม') {
            totalScore = myRow[key];
          } else if (key.includes('เก็บจริง')) {
            weightedScore = myRow[key];
          }
        });
      }

      quizzesResult.push({
        subject_name: subjName,
        teacher_name: subj['ครูผู้สอน'] || 'ครูกนกวรรณ ชัยชนะ',
        units,
        totalScore,
        weightedScore
      });
    }));

    return quizzesResult;
  },

  getTeacherSubjects: async (teacherId: string) => {
    if (USE_MOCK) return mockApi.getTeacherSubjects(teacherId);
    const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
    return subjectsRaw.map((s: any) => ({
      subject_id: s['รหัสรายวิชา'],
      name: s['ชื่อรายวิชา'],
      class_id: s['ห้องเรียน']
    }));
  },

  getTeacherDashboard: async (subjectName: string, classId: string) => {
    if (USE_MOCK) return mockApi.getTeacherDashboard(subjectName, classId);
    
    // 1. Fetch master list to find the correct Sheet ID and Subject Name
    const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
    const subjectRow = subjectsRaw.find((s: any) => s['ชื่อรายวิชา'] === subjectName && s['ห้องเรียน'] === classId);
    
    if (!subjectRow) throw new Error('ไม่พบข้อมูลรายวิชานี้ในชีตรวม');

    const targetSheetId = subjectRow['Sheet ID'] || subjectRow['ลิงก์'] || subjectRow['Link'] || SHEET_IDS[0];
    
    const cutGradeTab = `${subjectName}_ตัดเกรด`;
    const attendanceTab = `${subjectName}_เข้าเรียน`;
    const assignmentTab = `${subjectName}_คะแนนเก็บรายหน่วย`;

    const [grades, attendances, assignments] = await Promise.all([
      fetchSheetData(targetSheetId, cutGradeTab),
      fetchSheetData(targetSheetId, attendanceTab),
      fetchSheetData(targetSheetId, assignmentTab).catch(() => [])
    ]);
    
    const studentsData = grades.map((g: any) => {
       const rawId = g['รหัสนักเรียน'] || g['student_id'];
       if (!rawId) return null;
       const stdId = String(rawId);

       const att = attendances.find((a: any) => String(a['รหัสนักเรียน'] || a['student_id'] || '') === stdId) || {};
       let lateCount = 0;
       let absentCount = 0;
       let presentCount = 0;
       let leaveBusinessCount = 0;
       let leaveSickCount = 0;
       const attendanceDetails: { date: string; status: string }[] = [];

       Object.keys(att).forEach(key => {
         const val = String(att[key] || '').trim();
         if (['เช็คชื่อเข้าเรียน ลำดับ', 'ลำดับ', 'รหัสนักเรียน', 'student_id', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'รหัสห้องเรียน', 'ห้องเรียน'].includes(key) || key.startsWith('Column')) {
           return;
         }
         if (val === 'สาย') lateCount++;
         else if (val === 'ขาด') absentCount++;
         else if (val === 'มา' || val === 'มาเรียน') presentCount++;
         else if (val.includes('ลากิจ')) leaveBusinessCount++;
         else if (val.includes('ป่วย')) leaveSickCount++;
         else if (val.includes('ลา')) leaveBusinessCount++;

         if (val && val !== 'null' && val !== 'undefined') {
           const dateMatch = key.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
           const cleanDate = dateMatch ? dateMatch[0] : key;
           attendanceDetails.push({ date: cleanDate, status: val });
         }
       });

       const myTasks = assignments.find((t: any) => String(t['รหัสนักเรียน'] || t['student_id'] || '') === stdId) || {};
       let missingCount = 0;
       Object.keys(myTasks).forEach(key => {
         if (isTaskKey(key)) {
           const val = myTasks[key];
           const strVal = String(val || '').trim();
           if (val === null || val === undefined || strVal === '' || strVal === '-' || strVal === 'ไม่ส่งงาน') {
             missingCount++;
           }
         }
       });

       const taskDetails: { title: string; score: any; isMissing: boolean }[] = [];
       Object.keys(myTasks).forEach(key => {
         if (isTaskKey(key)) {
           const val = myTasks[key];
           const strVal = String(val || '').trim();
           const isMissing = val === null || val === undefined || strVal === '' || strVal === '-' || strVal === 'ไม่ส่งงาน';
           const match = key.match(/\((\d+)\)/);
           let cleanTitle = key;
           if (match) cleanTitle = key.replace(/\s*\(\d+\)/, '').trim();

           taskDetails.push({
             title: cleanTitle,
             score: isMissing ? '-' : val,
             isMissing
           });
         }
       });

       return {
         student_id: stdId,
         name: `${g['ชื่อ'] || ''} ${g['นามสกุล'] || ''}`.trim(),
         missingCount,
         presentCount,
         lateCount,
         absentCount,
         leaveBusinessCount,
         leaveSickCount,
         attendanceDetails,
         taskDetails,
         scoreTasks: g['คะแนนงานรวม 30%'] || '-',
         scoreQuizzes: g['สอบย่อย 20%'] || '-',
         scoreBehavior: g['จิตพิสัย 20%'] || '-',
         scoreFinal: g['ปลายภาค 30%'] || '-',
         totalScore: g['คะแนนรวม (ตัดเกรด)'] || 0,
         grade: g['เกรด'] || '-'
       };
    }).filter(Boolean);

    let maxScore = 0;
    let minScore = 100;
    let totalScore = 0;

    studentsData.forEach((s: any) => {
      const score = Number(s.totalScore) || 0;
      totalScore += score;
      if (score > maxScore) maxScore = score;
      if (score < minScore) minScore = score;
    });

    return {
      stats: {
        studentCount: studentsData.length,
        totalMissing: studentsData.reduce((acc: number, s: any) => acc + s.missingCount, 0),
        totalAbsent: studentsData.reduce((acc: number, s: any) => acc + s.absentCount, 0),
        totalLate: studentsData.reduce((acc: number, s: any) => acc + s.lateCount, 0),
        avgScore: studentsData.length ? (totalScore / studentsData.length).toFixed(2) : 0,
        maxScore,
        minScore: studentsData.length ? minScore : 0
      },
      students: studentsData
    };
  }
};
