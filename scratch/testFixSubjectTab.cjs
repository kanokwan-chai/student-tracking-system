const https = require('https');

const SHEET_ID_3 = '1QlP2TRi35lgjOfysd732fiNe8w3x0ebBELFOQhy-URg';

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

const isValidStudentTab = (data) => {
  if (!data || data.length === 0) return false;
  const firstRow = data[0];
  // If first row has "รหัสรายวิชา", Google Sheets returned default first tab "รวมรายวิชา"
  if (firstRow['รหัสรายวิชา'] !== undefined) return false;
  return true;
};

async function testFetchSubjectTab() {
  const subjName = 'เทคโนโลยีดิจิทัลเพื่ออาชีพ';
  const classId = 'ธคก.1/1';
  const tabSuffix = 'ตัดเกรด';
  const targetSheetId = SHEET_ID_3;

  const roomShort = (classId || '').replace('ปวช.', '').trim();
  const roomEscaped = roomShort.replace('/', '\\/');
  const candidates = [
    `${subjName}_${tabSuffix}`,
    `${subjName}_${roomShort}_${tabSuffix}`,
    `${subjName}_${roomEscaped}_${tabSuffix}`,
    `${subjName}_${classId}_${tabSuffix}`,
    tabSuffix
  ];

  console.log('Testing candidates order...');
  for (const tab of candidates) {
    const data = await fetchGvizData(targetSheetId, tab);
    const valid = isValidStudentTab(data);
    console.log(`Candidate tab "${tab}": rows=${data.length}, isValidStudentTab=${valid}`);
    if (valid) {
      console.log('==> SUCCESS MATCHED TAB:', tab);
      console.log('Sample data:', data.slice(0, 3));
      break;
    }
  }
}

testFetchSubjectTab();
