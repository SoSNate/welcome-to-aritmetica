/**
 * Google Apps Script for Mentors Project (Or LaMishpachot - Hesbonautika)
 * Separates leads into 'הורים' and 'סטודנטים מתנדבים' tabs,
 * and sends an email notification to service@nt-school.app.
 */

var NOTIFY_EMAIL = 'service@nt-school.app';
var SPREADSHEET_ID = '1vBqgELdkPDa_KcodfkROSTcrM_suJ2CypGNvr_zkqUU';

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var role = String(data.role || data.type || '').toLowerCase();
    var isParent = role.indexOf('parent') !== -1 || role.indexOf('הורה') !== -1 || role.indexOf('הורים') !== -1;
    var sheetName = isParent ? 'הורים' : 'סטודנטים מתנדבים';
    var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];

    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm:ss');
    var rowNum = Math.max(1, sheet.getLastRow());

    var name = data.name || data.fullName || '';
    var rawPhone = String(data.phone || '').replace(/['\s-]/g, '');
    var phone = rawPhone ? ("'" + rawPhone) : '';
    var email = data.email || '';
    var countOrStudies = data.count || data.studentsCount || data.studies || '';
    var aboutOrExp = data.about || data.notes || data.experience || '';

    sheet.appendRow([
      rowNum,
      nowStr,
      name,
      phone,
      email,
      countOrStudies,
      aboutOrExp,
      'חדש'
    ]);

    sendNotification({
      typeLabel: isParent ? 'הורה (פרויקט חונכים)' : 'סטודנט/ית מתנדב/ת (פרויקט חונכים)',
      name: name,
      phone: rawPhone,
      email: email,
      countOrStudies: countOrStudies,
      aboutOrExp: aboutOrExp,
      nowStr: nowStr,
      sheetUrl: ss.getUrl()
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Recorded successfully in ' + sheetName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Error in doPost: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotification(info) {
  if (!NOTIFY_EMAIL) return;
  try {
    var subject = 'נרשם/ה חדש/ה לפרויקט החונכים: ' + info.typeLabel + ' - ' + (info.name || 'ללא שם');
    var body = [
      'התקבל רישום חדש בפרויקט החונכים (אור למשפחות בשיתוף חשבונאוטיקה):',
      '--------------------------------------------------',
      'סוג נרשם: ' + info.typeLabel,
      'שם מלא: ' + (info.name || '-'),
      'טלפון: ' + (info.phone || '-'),
      'אימייל: ' + (info.email || '-'),
      'כיתה / לימודים: ' + (info.countOrStudies || '-'),
      'הערות / רקע: ' + (info.aboutOrExp || '-'),
      'תאריך ושעה: ' + info.nowStr,
      '--------------------------------------------------',
      'לטבלת הנתונים המלאה: ' + info.sheetUrl
    ].join('\n');

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (e) {
    console.error('Failed to send email notification: ' + e.toString());
  }
}
