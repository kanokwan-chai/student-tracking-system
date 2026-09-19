// src/services/googleSheets.ts
export const SHEET_IDS = [
  '12cYG8i_Vw5rpRvcOa29FeygMlhg89nbqywJEl2_HFzI',
  '1N0uBII7iwSNaQcV_OWeBFE0qZ1hMya4f3791hzydOCY',
  '1NVHwCFyNJ9g7HeXB37aJuBbgGmgeZ6dApxEcTJZCiwY',
  '1QlP2TRi35lgjOfysd732fiNe8w3x0ebBELFOQhy-URg'
];

export async function fetchSheetData(sheetId: string, sheetName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    const jsonStr = text.match(/(?<=.*\().*(?=\);)/s);
    if (!jsonStr || !jsonStr[0]) {
      throw new Error("Invalid response format");
    }
    const data = JSON.parse(jsonStr[0]);
    
    let headers: string[] = [];
    let rowsData = data.table.rows;

    // 1. Scan rows for the true header row (ignoring what Google thinks are the headers)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(5, data.table.rows.length); i++) {
      const rowVals = data.table.rows[i].c.map((c: any) => c ? (c.f !== undefined ? String(c.f).trim() : (c.v !== null ? String(c.v).trim() : '')) : '');
      
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
       // We found the true header row in the data
       rowsData = data.table.rows.slice(headerRowIndex + 1);
       
       // Patch missing "รหัสนักเรียน" if they merged cells
       if (headers.includes('ชื่อ') && headers.includes('นามสกุล')) {
         if (!headers[1]) headers[1] = 'รหัสนักเรียน';
         if (!headers[0]) headers[0] = 'ลำดับ';
       }
    } else {
       // Fallback: If no recognizable header row is found in the first 5 rows,
       // trust Google's parsed cols if they exist, otherwise use row 0.
       if (data.table.parsedNumHeaders > 0) {
         headers = data.table.cols.map((c: any) => c.label);
       } else if (data.table.rows.length > 0) {
         headers = data.table.rows[0].c.map((c: any) => c && c.v !== null ? String(c.v).trim() : '');
         rowsData = data.table.rows.slice(1);
       }
    }

    // Generate valid header names for empty columns
    headers = headers.map((h, i) => h || `Column${i+1}`);

    const rows = rowsData.map((row: any) => {
      const rowData: Record<string, any> = {};
      row.c.forEach((cell: any, index: number) => {
        if (headers[index] && headers[index] !== '') {
          rowData[headers[index]] = cell && cell.v !== null ? cell.v : null;
        }
      });
      return rowData;
    });

    return rows;
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName} from ${sheetId}:`, error);
    return [];
  }
}
