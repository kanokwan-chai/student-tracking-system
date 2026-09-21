const { fetchSheetData, SHEET_IDS } = require('../src/services/googleSheets.js');

// Helper to filter out summary and metadata columns
const isTaskKey = (key) => {
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

const fetchSubjectTab = async (targetSheetId, subjName, classId, tabSuffix) => {
  const roomShort = (classId || '').replace('ปวช.', '').trim();
  const roomEscaped = roomShort.replace('/', '\\/');
  const candidates = [
    `${subjName}_${tabSuffix}`,
    `${subjName}_${roomShort}_${tabSuffix}`,
    `${subjName}_${roomEscaped}_${tabSuffix}`,
    `${subjName}_${classId}_${tabSuffix}`,
    tabSuffix
  ];

  for (const tab of candidates) {
    try {
      const data = await fetchSheetData(targetSheetId, tab);
      if (data && data.length > 0) {
        console.log(`Successfully fetched tab: "${tab}" (${data.length} rows)`);
        return data;
      }
    } catch (e) {
      // try next
    }
  }
  return [];
};

async function runTest() {
  const studentId = '69001';
  const studentsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');
  const studentInfo = studentsRaw.find((s) => String(s['รหัสนักเรียน'] || s['student_id'] || '') === String(studentId));
  console.log('Student Info:', studentInfo);

  const studentClass = studentInfo['ห้องเรียน'] || studentInfo['รหัสห้องเรียน'];
  const subjectsRaw = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
  const mySubjects = subjectsRaw.filter((s) => 
    s['ห้องเรียน'] === studentClass || 
    s['รหัสห้องเรียน'] === studentClass ||
    s['ห้องเรียน'] === studentInfo['ห้องเรียน']
  );

  console.log('My subjects:', mySubjects.map(s => s['ชื่อรายวิชา']));

  let assignmentsList = [];
  for (const subj of mySubjects) {
    const targetSheetId = subj['Sheet ID'] || subj['กระดาษคำนวณ'] || subj['Link'] || SHEET_IDS[0];
    const subjName = subj['ชื่อรายวิชา'];
    const classId = subj['ห้องเรียน'] || studentClass;

    const tasks = await fetchSubjectTab(targetSheetId, subjName, classId, 'คะแนนเก็บรายหน่วย');
    const myTasks = tasks.find((t) => String(t['รหัสนักเรียน'] || t['student_id'] || '') === String(studentId));
    
    if (myTasks) {
       for (const key of Object.keys(myTasks)) {
         if (isTaskKey(key)) {
            const val = myTasks[key];
            const strVal = String(val || '').trim();
            const isMissing = val === null || val === undefined || strVal === '' || strVal === '-' || strVal === 'ไม่ส่งงาน';
            
            const match = key.match(/\((\d+)\)/);
            const max_score = match ? Number(match[1]) : 10;
            let cleanTitle = match ? key.replace(/\s*\(\d+\)/, '').trim() : key;

            assignmentsList.push({
              subject: subjName,
              title: cleanTitle,
              max_score,
              score: isMissing ? null : val,
              status: isMissing ? 'missing' : 'submitted'
            });
         }
       }
    }
  }

  console.log('\n--- FETCHED ASSIGNMENTS ---');
  console.table(assignmentsList);
}

runTest();
