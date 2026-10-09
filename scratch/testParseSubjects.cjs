const https = require('https');

const SHEET_IDS = [
  '12cYG8i_Vw5rpRvcOa29FeygMlhg89nbqywJEl2_HFzI'
];

function fetchSheetData(sheetId, sheetName) {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
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

          const rows = rowsData.map((row) => {
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

          resolve(rows);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  const subjects = await fetchSheetData(SHEET_IDS[0], 'รวมรายวิชา');
  console.log('Parsed subjects from รวมรายวิชา:');
  console.log(subjects);
}

runTest();
