/**
 * Athlete intake form -> n8n webhook.
 *
 * Lives in Google (Extensions -> Apps Script on the RESPONSES SPREADSHEET), but this
 * file is the source of truth, per the standing rule in triaperformance-project-instructions.md:
 * nothing that runs on a schedule or a trigger exists only outside the repo.
 * Edit here, paste there, never the other way round.
 *
 * SETUP
 * 1. Responses spreadsheet -> Extensions -> Apps Script. Paste this file.
 * 2. Project Settings -> Script Properties, add:
 *      WEBHOOK_URL    = https://triaperformance.com/api/athlete-intake
 *      INTAKE_SECRET  = <a long random string; same value goes in the n8n workflow>
 *      ALERT_EMAIL    = coach@triaperformance.com
 * 3. Triggers -> Add Trigger:
 *      function: onFormSubmitToWebhook
 *      source:   From spreadsheet
 *      event:    On form submit          <-- must be the INSTALLABLE trigger.
 *                                            The simple onFormSubmit() cannot call
 *                                            external URLs; UrlFetchApp needs auth.
 * 4. Repeat on the OTHER language's spreadsheet if ES and EN are separate files.
 *
 * Uses e.namedValues, which arrives keyed by QUESTION TEXT rather than column
 * position. That matters here: Google Forms appends new questions as new columns
 * at the far right of the sheet regardless of form order, and deleting a question
 * leaves its column in place. Anything keyed on column index would already be wrong.
 */

function onFormSubmitToWebhook(e) {
  var props = PropertiesService.getScriptProperties();
  var url    = props.getProperty('WEBHOOK_URL');
  var secret = props.getProperty('INTAKE_SECRET');
  var alert  = props.getProperty('ALERT_EMAIL');

  try {
    var answers = {};
    var named = e.namedValues || {};
    for (var key in named) {
      if (!named.hasOwnProperty(key)) continue;
      var v = named[key];
      answers[String(key).trim()] = (v && v.join ? v.join(' | ') : String(v)).trim();
    }

    // Language is detected from the question text, not the sheet name -- sheets get
    // renamed and copied ("Copy of ES"), question text doesn't.
    var lang = answers['Correo electrónico'] !== undefined ? 'SPANISH'
             : answers['Email address']      !== undefined ? 'ENGLISH'
             : 'UNKNOWN';

    var payload = {
      form_language: lang,
      submitted_at: new Date().toISOString(),
      sheet_name: (e.range && e.range.getSheet) ? e.range.getSheet().getName() : '',
      answers: answers
    };

    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Intake-Secret': secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() >= 300) {
      throw new Error('HTTP ' + res.getResponseCode() + ' — ' + res.getContentText());
    }

  } catch (err) {
    // A silently lost submission is the worst outcome here: the athlete believes
    // they have done their part and nothing downstream ever knows. The row is still
    // safe in the sheet, so this email is enough to recover by hand.
    MailApp.sendEmail(
      alert || 'coach@triaperformance.com',
      'FALLO: formulario de onboarding no llegó a n8n',
      'El atleta completó el formulario pero el webhook falló.\n' +
      'La respuesta SIGUE guardada en el Google Sheet — no se perdió.\n\n' +
      'Error: ' + err + '\n\n' +
      'Payload:\n' + JSON.stringify(e && e.namedValues, null, 2)
    );
  }
}
