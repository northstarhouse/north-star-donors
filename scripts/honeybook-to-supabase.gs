// Google Apps Script: Sync HoneyBook leads from Google Sheet to Supabase
//
// Setup:
//   1. Open the HoneyBook leads Google Sheet
//   2. Extensions → Apps Script → paste this file
//   3. Fill in SUPABASE_URL and SUPABASE_KEY below
//   4. Run syncHoneyBook() once manually
//   5. Triggers → Add Trigger → syncHoneyBook → Day timer (daily sync)
//
// The sheet is expected to have these columns (row 1 = headers):
//   #, Project Name, Full Name, Email Address, Phone Number,
//   Project Date, Lead Created Date, Total Project Value,
//   Lead Source, Lead Source Open Text, Booked Date

var HB_CONFIG = {
  SHEET_NAME:    'Sheet1',              // change if your sheet tab has a different name
  SUPABASE_URL:  'https://uvzwhhwzelaelfhfkvdb.supabase.co',
  SUPABASE_KEY:  'sb_publishable_EbFMfEbyEp3gASl-GZm3tQ_LnPEe5do',
  TABLE:         'data_honeybook_leads'
};

function syncHoneyBook() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HB_CONFIG.SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  // Column index helpers
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

  Logger.log('Found ' + (data.length - 1) + ' leads');

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[C.name] && !r[C.project]) continue;

    rows.push({
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

  if (rows.length === 0) { Logger.log('No rows to sync'); return; }

  // Clear existing rows then insert fresh (full replace)
  deleteAll();

  // Supabase has a 1000-row insert limit — chunk if needed
  var chunkSize = 500;
  for (var j = 0; j < rows.length; j += chunkSize) {
    var chunk = rows.slice(j, j + chunkSize);
    var url = HB_CONFIG.SUPABASE_URL + '/rest/v1/' + HB_CONFIG.TABLE;
    var options = {
      method:      'POST',
      contentType: 'application/json',
      headers: {
        'apikey':        HB_CONFIG.SUPABASE_KEY,
        'Authorization': 'Bearer ' + HB_CONFIG.SUPABASE_KEY,
        'Prefer':        'return=minimal'
      },
      payload:            JSON.stringify(chunk),
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(url, options);
    var code     = response.getResponseCode();
    if (code >= 200 && code < 300) {
      Logger.log('Inserted rows ' + j + '-' + (j + chunk.length - 1));
    } else {
      Logger.log('Insert error ' + code + ': ' + response.getContentText());
    }
  }

  Logger.log('Done. Synced ' + rows.length + ' leads.');
}

function deleteAll() {
  var url = HB_CONFIG.SUPABASE_URL + '/rest/v1/' + HB_CONFIG.TABLE + '?id=neq.00000000-0000-0000-0000-000000000000';
  var options = {
    method:  'DELETE',
    headers: {
      'apikey':        HB_CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + HB_CONFIG.SUPABASE_KEY,
    },
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log('Cleared table: HTTP ' + response.getResponseCode());
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
  if (!s || s === 'TBD' || s === '') return null;
  // Try parsing "Jan 01, 2026" format
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    var y2 = parsed.getFullYear();
    var m2 = String(parsed.getMonth() + 1).padStart(2, '0');
    var d2 = String(parsed.getDate()).padStart(2, '0');
    return y2 + '-' + m2 + '-' + d2;
  }
  return null;
}
