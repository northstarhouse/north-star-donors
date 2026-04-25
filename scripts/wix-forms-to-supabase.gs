// Google Apps Script: Sync Wix form submissions into Supabase
//
// Setup:
//   1. Open your Apps Script project that already has Wix access
//   2. Add this file alongside wix-webapp.gs
//   3. Fill in the CONFIG values below
//   4. Run syncWixForms() once manually to authorize
//   5. Triggers -> Add Trigger -> syncWixForms -> Time-driven

var WIX_FORMS_CONFIG = {
  WIX_TOKEN:     'REPLACE_ME',
  WIX_SITE:      'REPLACE_ME',
  SUPABASE_URL:  'https://uvzwhhwzelaelfhfkvdb.supabase.co',
  SUPABASE_KEY:  'sb_publishable_EbFMfEbyEp3gASl-GZm3tQ_LnPEe5do',
  TABLE:         'data_wix_forms'
};

var WIX_FORM_NAMES = {
  // Optional overrides when you want a custom display title for a known form ID.
};

var WIX_KEY_LABELS = {
  'long_answer':  'Message',
  'form_field':   'Inquiry Type',
  'form_field_1': 'Phone'
};

function syncWixForms() {
  var formNames = fetchWixFormNamesMap();
  var submissions = fetchWixForms(formNames);
  if (!submissions.length) {
    Logger.log('No Wix forms returned');
    return;
  }

  var chunkSize = 500;
  for (var i = 0; i < submissions.length; i += chunkSize) {
    upsertFormsChunk(submissions.slice(i, i + chunkSize));
  }

  Logger.log('Done. Synced ' + submissions.length + ' Wix submissions.');
}

function fetchWixForms(formNames) {
  return fetchAllWixSubmissions().map(function(s) {
    return {
      id:         String(s.id),
      form_id:    String(s.formId || ''),
      form_name:  formNames[s.formId] || WIX_FORM_NAMES[s.formId] || 'Other Form',
      status:     s.status ? String(s.status) : null,
      created_at: s.createdDate,
      fields:     normalizeWixFields(s.submissions || {})
    };
  });
}

function fetchWixFormNamesMap() {
  var out = {};
  var offset = 0;
  var limit = 100;

  while (true) {
    var resp = UrlFetchApp.fetch('https://www.wixapis.com/form-schema-service/v4/forms/query', {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': WIX_FORMS_CONFIG.WIX_TOKEN,
        'wix-site-id':   WIX_FORMS_CONFIG.WIX_SITE
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

    var code = resp.getResponseCode();
    if (code !== 200) {
      Logger.log('Wix form schemas error ' + code + ': ' + resp.getContentText());
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

  for (var id in WIX_FORM_NAMES) out[id] = WIX_FORM_NAMES[id];
  Logger.log('Resolved ' + Object.keys(out).length + ' Wix form names');
  return out;
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
        'Authorization': WIX_FORMS_CONFIG.WIX_TOKEN,
        'wix-site-id':   WIX_FORMS_CONFIG.WIX_SITE
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

    var code = resp.getResponseCode();
    if (code !== 200) {
      Logger.log('Wix forms error ' + code + ': ' + resp.getContentText());
      break;
    }

    var json = JSON.parse(resp.getContentText());
    var rows = json.submissions || json.items || json.results || [];
    all = all.concat(rows);
    if (rows.length < limit) break;
    offset += limit;
  }

  return all;
}

function upsertFormsChunk(rows) {
  var url = WIX_FORMS_CONFIG.SUPABASE_URL
    + '/rest/v1/' + WIX_FORMS_CONFIG.TABLE
    + '?on_conflict=id';

  var response = UrlFetchApp.fetch(url, {
    method:      'POST',
    contentType: 'application/json',
    headers: {
      'apikey':        WIX_FORMS_CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + WIX_FORMS_CONFIG.SUPABASE_KEY,
      'Prefer':        'resolution=merge-duplicates'
    },
    payload:            JSON.stringify(rows),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    Logger.log('Upserted ' + rows.length + ' Wix submissions');
  } else {
    Logger.log('Supabase error ' + code + ': ' + response.getContentText());
  }
}

function normalizeWixFields(raw) {
  var out = {};
  for (var k in raw) {
    var v = raw[k];
    if (v === null || v === undefined || v === '' || v === false) continue;
    if (v === true) v = 'Yes';

    var clean = k.replace(/_[0-9a-f]{4}$/i, '');
    var label = WIX_KEY_LABELS[clean] || WIX_KEY_LABELS[k]
      || clean.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

    out[label] = String(v);
  }
  return out;
}
