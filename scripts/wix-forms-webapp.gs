// Google Apps Script: Dedicated Wix forms web app
//
// Setup:
//   1. Open script.google.com -> New project
//   2. Paste this file
//   3. Fill in WIX_TOKEN and WIX_SITE
//   4. Deploy -> Manage deployments -> Web app -> Anyone
//   5. Paste the deployed URL into FORMS_URL in app/data/page.tsx

var WIX_TOKEN = 'REPLACE_ME';
var WIX_SITE  = 'REPLACE_ME';

var FORM_NAME_OVERRIDES = {
  // Optional overrides when you want custom display names by form ID.
};

var KEY_LABELS = {
  'long_answer':  'Message',
  'form_field':   'Inquiry Type',
  'form_field_1': 'Phone'
};

function doGet() {
  var formNames = fetchFormNamesMap();
  var submissions = fetchAllWixSubmissions().map(function(s) {
    return {
      id:         s.id,
      form_id:    s.formId,
      form_name:  formNames[s.formId] || FORM_NAME_OVERRIDES[s.formId] || 'Other Form',
      status:     s.status,
      created_at: s.createdDate,
      fields:     normalizeFields(s.submissions || {})
    };
  });

  return ContentService
    .createTextOutput(JSON.stringify({ submissions: submissions }))
    .setMimeType(ContentService.MimeType.JSON);
}

function fetchAllWixSubmissions() {
  var all = [];
  var offset = 0;
  var limit = 100;

  while (true) {
    var resp = UrlFetchApp.fetch('https://www.wixapis.com/form-submission-service/v4/submissions/namespace/query', {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': WIX_TOKEN,
        'wix-site-id':   WIX_SITE
      },
      payload: JSON.stringify({
        query: {
          filter: { namespace: { '$eq': 'wix.form_app.form' } },
          sort: [{ fieldName: 'createdDate', order: 'DESC' }],
          paging: { limit: limit, offset: offset }
        }
      }),
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      Logger.log('Forms error ' + resp.getResponseCode() + ': ' + resp.getContentText());
      break;
    }

    var data = JSON.parse(resp.getContentText());
    var rows = data.submissions || data.items || data.results || [];
    all = all.concat(rows);
    if (rows.length < limit) break;
    offset += limit;
  }

  return all;
}

function fetchFormNamesMap() {
  var out = {};
  var offset = 0;
  var limit = 100;

  while (true) {
    var resp = UrlFetchApp.fetch('https://www.wixapis.com/form-schema-service/v4/forms/query', {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': WIX_TOKEN,
        'wix-site-id':   WIX_SITE
      },
      payload: JSON.stringify({
        query: {
          filter: { namespace: { '$eq': 'wix.form_app.form' } },
          sort: [{ fieldName: 'createdDate', order: 'DESC' }],
          paging: { limit: limit, offset: offset }
        }
      }),
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      Logger.log('Form schema error ' + resp.getResponseCode() + ': ' + resp.getContentText());
      break;
    }

    var json = JSON.parse(resp.getContentText());
    var rows = json.forms || json.items || json.results || [];
    rows.forEach(function(form) {
      var id = String(form.id || form.formId || '');
      var name = form.name || form.displayName || form.title || form.formName || (form.properties && form.properties.name) || '';
      if (id && name) out[id] = String(name);
    });

    if (rows.length < limit) break;
    offset += limit;
  }

  for (var id in FORM_NAME_OVERRIDES) out[id] = FORM_NAME_OVERRIDES[id];
  return out;
}

function normalizeFields(raw) {
  var out = {};
  for (var k in raw) {
    var v = raw[k];
    if (v === null || v === undefined || v === '' || v === false) continue;
    if (v === true) v = 'Yes';

    var clean = k.replace(/_[0-9a-f]{4}$/i, '');
    var label = KEY_LABELS[clean] || KEY_LABELS[k]
      || clean.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

    out[label] = String(v);
  }
  return out;
}
