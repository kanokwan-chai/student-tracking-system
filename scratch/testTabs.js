fetch('https://docs.google.com/spreadsheets/d/12cYG8i_Vw5rpRvcOa29FeygMlhg89nbqywJEl2_HFzI/htmlview')
  .then(r => r.text())
  .then(html => {
    const sheetNameMatches = [...html.matchAll(/name:\s*"([^"]+)"/g)];
    console.log('Sheet names found:', sheetNameMatches.map(m => m[1]));
    const ariaMatches = [...html.matchAll(/aria-label="([^"]+)"/g)];
    console.log('Aria labels:', ariaMatches.map(m => m[1]));
    const itemMatches = [...html.matchAll(/<div class="sheet-name">([^<]+)<\/div>/g)];
    console.log('Sheet-name divs:', itemMatches.map(m => m[1]));
  });
