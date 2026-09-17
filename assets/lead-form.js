/**
 * Shared lead-capture form submission logic, reused across teacher/parent/
 * institution forms. Posts to the existing Apps Script Web App (no-cors,
 * so response body is unreadable — success is inferred by not throwing,
 * matching the pattern already used in the current index.html).
 */
const LEAD_FORM_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrRFJIYBSiXXGhR_jwbTfeTlGVRhH1YMuV8IwPWmSz36Wtv9CI4ydPnD8_VWQB9L8s/exec";

function submitLeadForm(formEl, role, onSuccess) {
  const prefix = formEl.dataset.prefix || 'f';
  const errorDiv = document.getElementById(prefix + '-error-message');
  if (errorDiv) errorDiv.classList.add('hidden');

  // Consent is a condition of collecting these details, not a formality: the
  // form gathers a name, a phone number and an email and forwards them to an
  // external Apps Script. Checked here as well as in the markup so the
  // required attribute cannot simply be removed in devtools.
  const consentBox = document.getElementById(prefix + '-consent');
  if (consentBox && !consentBox.checked) {
    if (errorDiv) {
      errorDiv.textContent = 'יש לאשר את מדיניות הפרטיות ואת החזרה אליכם כדי לשלוח.';
      errorDiv.classList.remove('hidden');
    }
    return false;
  }

  const name = document.getElementById(prefix + '-name').value.trim();
  const phone = document.getElementById(prefix + '-phone').value.trim();
  const email = document.getElementById(prefix + '-email').value.trim();
  const countField = document.getElementById(prefix + '-count');
  const studentsCount = countField ? countField.value : '';

  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 9 || digits.length > 10 || digits[0] !== '0') {
    if (errorDiv) {
      errorDiv.textContent = 'חובה להזין מספר טלפון תקין ליצירת קשר (לדוגמה: 050-0000000).';
      errorDiv.classList.remove('hidden');
    }
    return false;
  }
  if (!email) {
    if (errorDiv) {
      errorDiv.textContent = 'חובה להזין כתובת דוא"ל ליצירת קשר.';
      errorDiv.classList.remove('hidden');
    }
    return false;
  }

  const submitPromise = fetch(LEAD_FORM_APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name, phone: phone, email: email, studentsCount: studentsCount, role: role,
      consentAt: new Date().toISOString()
    })
  });
  const timeoutPromise = new Promise(function (resolve) { setTimeout(resolve, 5000); });

  Promise.race([submitPromise, timeoutPromise]).then(function () {
    if (window.gtag) window.gtag('event', 'lead_submit', { role: role });
    if (onSuccess) onSuccess();
  });
  submitPromise.catch(function () {});
  return true;
}
