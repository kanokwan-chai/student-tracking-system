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
            if (rowVals.includes('รหัสรายวิชา') || rowVals.includes('ชื่อรายวิชา')) {
              headerRowIndex = i;
              headers = [...rowVals];
              break;
            }
          }

          if (headerRowIndex !== -1) {
             rowsData = parsed.table.rows.slice(headerRowIndex + 1);
          } else if (parsed.table.rows.length > 0) {
             headers = parsed.table.rows[0].c.map((c) => c && c.v !== null ? String(c.v).trim() : '');
             rowsData = parsed.table.rows.slice(1);
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

async function inspectSubjectsSheet() {
  const subjects = await fetchGvizData(SHEET_IDS[0], 'รวมรายวิชา');
  console.log('All subjects in Sheet 0 [รวมรายวิชา]:');
  console.log(JSON.stringify(subjects, null, 2));
}

inspectSubjectsSheet();
