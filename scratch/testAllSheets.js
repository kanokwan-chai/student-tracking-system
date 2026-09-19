const sheetIds = [
  '12cYG8i_Vw5rpRvcOa29FeygMlhg89nbqywJEl2_HFzI',
  '1N0uBII7iwSNaQcV_OWeBFE0qZ1hMya4f3791hzydOCY',
  '1NVHwCFyNJ9g7HeXB37aJuBbgGmgeZ6dApxEcTJZCiwY',
  '1QlP2TRi35lgjOfysd732fiNe8w3x0ebBELFOQhy-URg'
];

async function check() {
  for (let i = 0; i < sheetIds.length; i++) {
    const html = await fetch(`https://docs.google.com/spreadsheets/d/${sheetIds[i]}/htmlview`).then(r => r.text());
    const matches = [...html.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
    console.log(`Sheet ${i+1} tabs:`, matches);
  }
}

check();
