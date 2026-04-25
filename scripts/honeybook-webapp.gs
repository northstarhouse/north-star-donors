// Google Apps Script: HoneyBook leads web app
//
// Setup:
//   1. Open script.google.com (or Extensions → Apps Script from the HoneyBook sheet)
//   2. Paste this entire file (replace any existing content)
//   3. Click Deploy → New deployment → Type: Web app
//      - Execute as: Me
//      - Who has access: Anyone
//   4. Click Deploy → copy the web app URL
//   5. Paste that URL into the app's HONEYBOOK_URL constant (app/data/page.tsx)
//
// The sheet is expected to have these columns (row 1 = headers):
//   #, Project Name, Full Name, Email Address, Phone Number,
//   Project Date, Lead Created Date, Total Project Value,
//   Lead Source, Lead Source Open Text, Booked Date

var SHEET_NAME = 'Sheet1'; // change if your tab has a different name

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var col = function(name) { return headers.indexOf(name); };
  var C = {
    num:        col('#'),
    project:    col('Project Name'),
    name:       col('Full Name'),
    email:      col('Email Address'),
    phone:      col('Phone Number'),
    projDate:   col('Project Date'),
    leadDate:   col('Lead Created Date'),
    value:      col('Total Project Value'),
    source:     col('Lead Source'),
    sourceText: col('Lead Source Open Text'),
    booked:     col('Booked Date'),
  };

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[C.name] && !r[C.project]) continue;

    rows.push({
      id:                   i,
      row_num:              r[C.num] || i,
      project_name:         String(r[C.project] || '').trim(),
      full_name:            String(r[C.name] || '').trim(),
      email:                String(r[C.email] || '').trim() || null,
      phone:                String(r[C.phone] || '').trim() || null,
      project_date:         String(r[C.projDate] || '').trim() || null,
      lead_created_date:    fmtDate(r[C.leadDate]),
      total_project_value:  parseFloat(r[C.value]) || null,
      lead_source:          String(r[C.source] || '').trim() || null,
      lead_source_text:     String(r[C.sourceText] || '').trim() || null,
      booked_date:          fmtDate(r[C.booked]),
    });
  }

  // Sort newest first by lead_created_date
  rows.sort(function(a, b) {
    if (!a.lead_created_date) return 1;
    if (!b.lead_created_date) return -1;
    return b.lead_created_date.localeCompare(a.lead_created_date);
  });

  return ContentService
    .createTextOutput(JSON.stringify({ leads: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function fmtDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  var s = String(val).trim();
  if (!s || s === 'TBD') return null;
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.getFullYear() + '-'
      + String(parsed.getMonth() + 1).padStart(2, '0') + '-'
      + String(parsed.getDate()).padStart(2, '0');
  }
  return null;
}
