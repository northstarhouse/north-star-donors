// Sync Wix form submissions into Supabase
// Add this file alongside wix-webapp.gs in the same GAS project.
// Trigger: Triggers → Add Trigger → syncWixForms → Time-driven (every hour)

var FORMS_SUPABASE_URL = 'https://uvzwhhwzelaelfhfkvdb.supabase.co';
var FORMS_SUPABASE_KEY = 'sb_publishable_EbFMfEbyEp3gASl-GZm3tQ_LnPEe5do';

function syncWixForms() {
  // Uses fetchFormNamesMap, fetchAllWixSubmissions, normalizeFields from wix-webapp.gs
  var formNames   = fetchFormNamesMap();
  var submissions = fetchAllWixSubmissions().map(function(s) {
    return {
      id:         String(s.id),
      form_id:    String(s.formId || ''),
      form_name:  formNames[s.formId] || 'Other Form',
      status:     s.status ? String(s.status) : null,
      created_at: s.createdDate,
      fields:     normalizeFields(s.submissions || {})
    };
  });

  if (!submissions.length) { Logger.log('syncWixForms: no submissions'); return; }

  for (var i = 0; i < submissions.length; i += 500) {
    var chunk = submissions.slice(i, i + 500);
    var resp  = UrlFetchApp.fetch(FORMS_SUPABASE_URL + '/rest/v1/data_wix_forms?on_conflict=id', {
      method: 'POST', contentType: 'application/json',
      headers: { 'apikey': FORMS_SUPABASE_KEY, 'Authorization': 'Bearer ' + FORMS_SUPABASE_KEY, 'Prefer': 'resolution=merge-duplicates' },
      payload: JSON.stringify(chunk), muteHttpExceptions: true
    });
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) Logger.log('Upserted ' + chunk.length + ' submissions');
    else Logger.log('Supabase error ' + code + ': ' + resp.getContentText());
  }

  Logger.log('syncWixForms done: ' + submissions.length + ' submissions');
}
