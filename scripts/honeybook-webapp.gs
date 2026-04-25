// Google Apps Script: HoneyBook leads web app
//
// Setup:
//   1. Open script.google.com (or Extensions → Apps Script from the HoneyBook sheet)
//   2. Paste this entire file (replace any existing content)
//   3. Click Deploy → Manage deployments → edit existing → New version → Deploy
//      (URL stays the same)
//
// Sheet1: Leads report  (#, Project Name, Full Name, Email Address, Phone Number,
//                         Project Date, Lead Created Date, Total Project Value,
//                         Lead Source, Lead Source Open Text, Booked Date)
// Sheet2: Booked clients report  (First Name, Last Name, Email, Project Name,
//                                  Project Type, Project Source, Project Creation Date,
//                                  Project Date, Booked Date, Total Booked Value,
//                                  Tax, Total Paid, Refunded Amount, Gratuity, Company)

var LEADS_SHEET  = 'Sheet1';
var BOOKED_SHEET = 'Sheet2';
var TOURS_SHEET  = 'Sheet3';

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var leads  = readLeads(ss);
  var booked = readBooked(ss);
  var tours  = readTours(ss);

  var sheetNames = ss.getSheets().map(function(s) { return s.getName(); });
  var sheet2 = ss.getSheetByName(BOOKED_SHEET);
  var sheet3 = ss.getSheetByName(TOURS_SHEET);
  var bookedHeaders = sheet2 ? sheet2.getRange(1, 1, 1, sheet2.getLastColumn()).getValues()[0] : [];
  var toursHeaders  = sheet3 ? sheet3.getRange(1, 1, 1, sheet3.getLastColumn()).getValues()[0] : [];

  return ContentService
    .createTextOutput(JSON.stringify({
      leads: leads, booked: booked, tours: tours,
      _sheets: sheetNames,
      _bookedCount: booked.length, _bookedHeaders: bookedHeaders,
      _toursCount: tours.length,   _toursHeaders:  toursHeaders
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet1: all leads ─────────────────────────────────────────────────────────

function readLeads(ss) {
  var sheet = ss.getSheetByName(LEADS_SHEET) || ss.getSheets()[0];
  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var col     = function(name) { return headers.indexOf(name.toLowerCase()); };

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
      id:                  i,
      row_num:             r[C.num] || i,
      project_name:        String(r[C.project] || '').trim(),
      full_name:           String(r[C.name]    || '').trim(),
      email:               String(r[C.email]   || '').trim() || null,
      phone:               String(r[C.phone]   || '').trim() || null,
      project_date:        String(r[C.projDate]|| '').trim() || null,
      lead_created_date:   fmtDate(r[C.leadDate]),
      total_project_value: parseFloat(r[C.value]) || null,
      lead_source:         String(r[C.source]  || '').trim() || null,
      lead_source_text:    String(r[C.sourceText] || '').trim() || null,
      booked_date:         fmtDate(r[C.booked]),
    });
  }

  rows.sort(function(a, b) {
    if (!a.lead_created_date) return 1;
    if (!b.lead_created_date) return -1;
    return b.lead_created_date.localeCompare(a.lead_created_date);
  });

  return rows;
}

// ── Sheet2: confirmed booked clients ─────────────────────────────────────────

function readBooked(ss) {
  var sheet = ss.getSheetByName(BOOKED_SHEET);
  if (!sheet) return [];

  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var col     = function(name) { return headers.indexOf(name.toLowerCase()); };

  var C = {
    firstName:   col('First Name'),
    lastName:    col('Last Name'),
    email:       col('Email'),
    project:     col('Project Name'),
    type:        col('Project Type'),
    source:      col('Project Source'),
    createdDate: col('Project Creation Date'),
    projDate:    col('Project Date'),
    bookedDate:  col('Booked Date'),
    value:       col('Total Booked Value'),
    paid:        col('Total Paid'),
    refunded:    col('Refunded Amount'),
    company:     col('Company'),
  };

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var first = String(r[C.firstName] || '').trim();
    var last  = String(r[C.lastName]  || '').trim();
    if (!first && !last) continue;

    rows.push({
      id:           i,
      full_name:    (first + ' ' + last).trim(),
      email:        String(r[C.email]   || '').trim() || null,
      project_name: String(r[C.project] || '').trim(),
      project_type: String(r[C.type]    || '').trim() || null,
      lead_source:  String(r[C.source]  || '').trim() || null,
      created_date: fmtDate(r[C.createdDate]),
      project_date: fmtDate(r[C.projDate]),
      booked_date:  fmtDate(r[C.bookedDate]),
      total_value:  parseFloat(r[C.value])    || null,
      total_paid:   parseFloat(r[C.paid])     || null,
      refunded:     parseFloat(r[C.refunded]) || 0,
      company:      String(r[C.company] || '').trim() || null,
    });
  }

  rows.sort(function(a, b) {
    if (!a.booked_date) return 1;
    if (!b.booked_date) return -1;
    return b.booked_date.localeCompare(a.booked_date);
  });

  return rows;
}

// ── Sheet3: tours (calendar export) ──────────────────────────────────────────
// Columns: Date, Day, Start Time, End Time, Name, Title, Address, Notes

function readTours(ss) {
  var sheet = ss.getSheetByName(TOURS_SHEET);
  if (!sheet) return [];

  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var col     = function(name) { return headers.indexOf(name.toLowerCase()); };

  var C = {
    date:      col('Date'),
    name:      col('Name'),
    title:     col('Title'),
    startTime: col('Start Time'),
    endTime:   col('End Time'),
    address:   col('Address'),
    notes:     col('Notes'),
  };

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var name = C.name > -1 ? String(r[C.name] || '').trim() : '';
    if (!name || name.toLowerCase() === 'test') continue;

    rows.push({
      id:         i,
      full_name:  name,
      tour_date:  C.date > -1 ? fmtDate(r[C.date]) : null,
      start_time: C.startTime > -1 ? String(r[C.startTime] || '').trim() || null : null,
      title:      C.title > -1 ? String(r[C.title] || '').trim() || null : null,
      notes:      C.notes > -1 ? String(r[C.notes] || '').trim() || null : null,
    });
  }

  rows.sort(function(a, b) {
    if (!a.tour_date) return 1;
    if (!b.tour_date) return -1;
    return b.tour_date.localeCompare(a.tour_date);
  });

  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  // Normalize "2026-01-26 21:14:54 UTC" → "2026-01-26T21:14:54Z"
  var utcPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}( UTC)?$/;
  if (utcPattern.test(s)) {
    s = s.replace(' UTC', 'Z').replace(' ', 'T');
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return parsed.getUTCFullYear() + '-'
        + String(parsed.getUTCMonth() + 1).padStart(2, '0') + '-'
        + String(parsed.getUTCDate()).padStart(2, '0');
    }
  }
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.getFullYear() + '-'
      + String(parsed.getMonth() + 1).padStart(2, '0') + '-'
      + String(parsed.getDate()).padStart(2, '0');
  }
  return null;
}
