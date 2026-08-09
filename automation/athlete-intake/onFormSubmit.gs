/**
 * Athlete intake form -> n8n webhook.
 *
 * Lives in Google (Extensions -> Apps Script on the responses spreadsheet), but this
 * file is the source of truth, per the standing rule in triaperformance-project-instructions.md:
 * nothing that runs on a schedule or a trigger exists only outside the repo.
 * Edit here, paste there, never the other way round.
 *
 * BOTH forms write to ONE spreadsheet, on two tabs: 'ES' and 'EN'.
 * A spreadsheet-level form-submit trigger fires for every form linked to that
 * spreadsheet, so this is ONE script and ONE trigger covering both languages.
 *
 * SETUP  (once — not once per language)
 * 1. Responses spreadsheet -> Extensions -> Apps Script. Paste this file.
 * 2. Project Settings -> Script Properties, add:
 *      WEBHOOK_URL    = https://triaperformance.com/api/athlete-intake
 *      INTAKE_SECRET  = <long random string; the same value goes in the n8n workflow>
 *      ALERT_EMAIL    = coach@triaperformance.com
 * 3. Triggers -> Add Trigger:
 *      function: onFormSubmitToWebhook
 *      source:   From spreadsheet
 *      event:    On form submit          <-- must be the INSTALLABLE trigger.
 *                                            The simple onFormSubmit() cannot call
 *                                            external URLs; UrlFetchApp needs auth.
 *
 * Answers are read from e.namedValues, keyed by QUESTION TEXT rather than column
 * position. That matters here: Google Forms appends new questions as new columns at
 * the far right of the sheet regardless of form order, and deleting a question leaves
 * its column in place. Anything keyed on column index would already be wrong — the
 * Aug 2026 form edit put the two new questions at columns 39 and 40, after the seven
 * dead 'Disponibilidad semanal' columns.
 */

var TAB_LANGUAGE = { 'ES': 'SPANISH', 'EN': 'ENGLISH' };

// A question that exists in exactly one language's form.
var LANGUAGE_MARKER = { 'Correo electrónico': 'SPANISH', 'Email address': 'ENGLISH' };

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

    var sheetName = (e.range && e.range.getSheet) ? e.range.getSheet().getName() : '';

    // Two independent signals, deliberately.
    // - The tab name is explicit and Ivan controls it, but it's a label and labels drift.
    // - The question text is derived from content and cannot be wrong.
    // Computing both costs nothing and catches a real misconfiguration: an ES form
    // rewired to the EN tab would otherwise send English athletes a Spanish briefing
    // with nothing anywhere saying so.
    var byTab = TAB_LANGUAGE[String(sheetName).trim().toUpperCase()] || '';
    var byQuestion = '';
    for (var marker in LANGUAGE_MARKER) {
      if (LANGUAGE_MARKER.hasOwnProperty(marker) && answers[marker] !== undefined) {
        byQuestion = LANGUAGE_MARKER[marker];
        break;
      }
    }

    var lang = byQuestion || byTab || 'UNKNOWN';   // content wins over label
    var mismatch = Boolean(byTab && byQuestion && byTab !== byQuestion);

    var payload = {
      form_language: lang,
      language_by_tab: byTab,
      language_by_question: byQuestion,
      language_mismatch: mismatch,
      sheet_name: sheetName,
      submitted_at: new Date().toISOString(),
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
    // A silently lost submission is the worst outcome in this whole flow: the athlete
    // believes they have done their part and nothing downstream ever knows. The row is
    // still safe in the sheet, so this email is enough to recover by hand.
    MailApp.sendEmail(
      alert || 'coach@triaperformance.com',
      'FALLO: formulario de onboarding no llegó a n8n',
      'El atleta completó el formulario pero el webhook falló.\n' +
      'La respuesta SIGUE guardada en el Google Sheet — no se perdió.\n\n' +
      'Pestaña: ' + ((e.range && e.range.getSheet) ? e.range.getSheet().getName() : '?') + '\n' +
      'Error: ' + err + '\n\n' +
      'Respuestas:\n' + JSON.stringify(e && e.namedValues, null, 2)
    );
  }
}

/**
 * Run this once, by hand, from the Apps Script editor to verify the whole path
 * (properties -> Caddy -> n8n -> Postgres) without waiting for a real athlete.
 * It replays the most recent row of the given tab as if it had just been submitted.
 */
function testReplayLastRow() {
  var TAB = 'ES';                      // change to 'EN' to test the other form
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error('No hay respuestas en la pestaña ' + TAB);

  var headers = values[0];
  var last = values[values.length - 1];
  var namedValues = {};
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim()) namedValues[String(headers[i]).trim()] = [String(last[i])];
  }

  onFormSubmitToWebhook({ namedValues: namedValues, range: { getSheet: function () { return sheet; } } });
  Logger.log('Replayed last row of ' + TAB + ' — check Telegram and athlete_intake.');
}
