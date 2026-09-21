const https = require('https');

const SHEET_IDS = [
  '12cYG8i_Vw5rpRvcOa29FeygMlhg89nbqywJEl2_HFzI'
];

function fetchGvizData(sheetId, tabName) {
  return new Promise((resolve, reject) => {
    const encodedTab = encodeURIComponent(tabName);
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodedTab}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonStr = data.match(/(?<=.*\().*(?=\);)/s);
          if (!jsonStr || !jsonStr[0]) return resolve([]);
          const parsed = JSON.parse(jsonStr[0]);
          
          let headers = [];
          let rowsData = parsed.table.rows;

          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(5, parsed.table.rows.length); i++) {
            const rowVals = parsed.table.rows[i].c.map((c) => c ? (c.f !== undefined ? String(c.f).trim() : (c.v !== null ? String(c.v).trim() : '')) : '');
            
            if (
              rowVals.includes('รหัสนักเรียน') || 
              rowVals.includes('รหัสรายวิชา') || 
              rowVals.includes('student_id') ||
              (rowVals.includes('ชื่อ') && rowVals.includes('นามสกุล'))
            ) {
              headerRowIndex = i;
              headers = [...rowVals];
              break;
            }
          }

          if (headerRowIndex !== -1) {
             rowsData = parsed.table.rows.slice(headerRowIndex + 1);
             if (headers.includes('ชื่อ') && headers.includes('นามสกุล')) {
               if (!headers[1]) headers[1] = 'รหัสนักเรียน';
               if (!headers[0]) headers[0] = 'ลำดับ';
             }
          } else {
             if (parsed.table.parsedNumHeaders > 0) {
               headers = parsed.table.cols.map((c) => c ? c.label : '');
             } else if (parsed.table.rows.length > 0) {
               headers = parsed.table.rows[0].c.map((c) => c && c.v !== null ? String(c.v).trim() : '');
               rowsData = parsed.table.rows.slice(1);
             }
          }

          headers = headers.map((h, i) => h || `Column${i+1}`);

          const result = rowsData.map((row) => {
            const rowData = {};
            if (row && row.c) {
              row.c.forEach((cell, index) => {
                if (headers[index] && headers[index] !== '') {
                  rowData[headers[index]] = cell && cell.v !== null ? cell.v : null;
                }
              });
            }
            return rowData;
          });

          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

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

async function testAssignments() {
  console.log('Fetching students master list...');
  const students = await fetchGvizData(SHEET_IDS[0], 'รวมรายชื่อนักเรียน');
  console.log(`Found ${students.length} students.`);

  const studentId = '69001';
  const studentInfo = students.find(s => String(s['รหัสนักเรียน'] || s['student_id'] || '') === studentId);
  console.log('Target Student 69001:', studentInfo);

  const studentClass = studentInfo['ห้องเรียน'] || studentInfo['รหัสห้องเรียน'];
  const subjects = await fetchGvizData(SHEET_IDS[0], 'รวมรายวิชา');

  const mySubjects = subjects.filter(s => 
    s['ห้องเรียน'] === studentClass || 
    s['รหัสห้องเรียน'] === studentClass ||
    s['ห้องเรียน'] === studentInfo['ห้องเรียน']
  );

  console.log(`Enrolled subjects for 69001: ${mySubjects.map(s => s['ชื่อรายวิชา']).join(', ')}`);

  let assignmentsList = [];

  for (const subj of mySubjects) {
    const subjName = subj['ชื่อรายวิชา'];
    const classId = subj['ห้องเรียน'] || studentClass;
    const roomShort = (classId || '').replace('ปวช.', '').trim();
    const roomEscaped = roomShort.replace('/', '\\/');

    const candidates = [
      `${subjName}_คะแนนเก็บรายหน่วย`,
      `${subjName}_${roomShort}_คะแนนเก็บรายหน่วย`,
      `${subjName}_${roomEscaped}_คะแนนเก็บรายหน่วย`,
      `คะแนนเก็บรายหน่วย`
    ];

    let tasks = [];
    for (const tab of candidates) {
      try {
        const res = await fetchGvizData(SHEET_IDS[0], tab);
        if (res && res.length > 0) {
          console.log(`[SUCCESS] Found tab "${tab}" with ${res.length} rows`);
          tasks = res;
          break;
        }
      } catch (e) {}
    }

    const myTasks = tasks.find(t => String(t['รหัสนักเรียน'] || t['student_id'] || '') === studentId);
    if (myTasks) {
      Object.keys(myTasks).forEach(key => {
        if (isTaskKey(key)) {
          const val = myTasks[key];
          const strVal = String(val || '').trim();
          const isMissing = val === null || val === undefined || strVal === '' || strVal === '-' || strVal === 'ไม่ส่งงาน';
          
          assignmentsList.push({
            subject: subjName,
            task: key,
            score: val !== null ? val : 'ยังไม่ส่ง',
            status: isMissing ? 'missing (ค้าง)' : 'submitted (ส่งแล้ว)'
          });
        }
      });
    }
  }

  console.log('\n--- LIVE ASSIGNMENTS RESULT FOR STUDENT 69001 ---');
  console.table(assignmentsList);
}

testAssignments();
