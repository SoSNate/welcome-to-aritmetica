/**
 * contact-bubble.js — Floating WhatsApp & Phone Contact Bubble
 *
 * Provides a floating interactive bubble with a popout speech card inviting
 * visitors to contact Netanel via WhatsApp or direct phone call.
 */
(function() {
  function initContactBubble() {
    if (document.getElementById('contactBubbleWrap')) return;

    const WA_NUMBER = '972552569496';
    const DISPLAY_PHONE = '055-2569496';
    const WA_MESSAGE = encodeURIComponent('היי נתנאל, הגעתי מדף הנחיתה של חשבונאוטיקה ואשמח לשמוע פרטים נוספים');
    const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;
    const TEL_URL = `tel:${DISPLAY_PHONE.replace(/-/g, '')}`;

    const styles = `
      #contactBubbleWrap {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 220;
        font-family: 'Heebo', system-ui, -apple-system, sans-serif;
        direction: rtl;
      }
      .contact-card-popout {
        position: absolute;
        bottom: 72px;
        left: 0;
        width: 310px;
        max-width: calc(100vw - 36px);
        background: #0d1527;
        border: 1px solid rgba(138, 180, 255, 0.25);
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 24px rgba(37, 211, 102, 0.15);
        color: #f1f5f9;
        opacity: 0;
        transform: translateY(16px) scale(0.96);
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 221;
      }
      .contact-card-popout.is-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .contact-card-popout::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 24px;
        width: 16px;
        height: 16px;
        background: #0d1527;
        border-right: 1px solid rgba(138, 180, 255, 0.25);
        border-bottom: 1px solid rgba(138, 180, 255, 0.25);
        transform: rotate(45deg);
      }
      .contact-btn-main {
        position: relative;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        border: none;
        color: white;
        box-shadow: 0 6px 24px rgba(37, 211, 102, 0.45);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        outline: none;
      }
      .contact-btn-main:hover {
        transform: scale(1.08);
        box-shadow: 0 8px 30px rgba(37, 211, 102, 0.6);
      }
      .contact-btn-main:active {
        transform: scale(0.94);
      }
      .contact-ripple-halo {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 2px solid #25D366;
        animation: contact-halo 2.4s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        pointer-events: none;
      }
      @keyframes contact-halo {
        0% { transform: scale(0.95); opacity: 0.8; }
        70% { transform: scale(1.35); opacity: 0; }
        100% { transform: scale(1.4); opacity: 0; }
      }
      .contact-badge-dot {
        position: absolute;
        top: 0;
        right: 0;
        width: 14px;
        height: 14px;
        background: #ef4444;
        border: 2px solid #070b14;
        border-radius: 50%;
      }
      .contact-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      .contact-action-wa {
        background: linear-gradient(135deg, #25D366 0%, #1da851 100%);
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
      }
      .contact-action-wa:hover {
        opacity: 0.95;
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(37, 211, 102, 0.45);
      }
      .contact-action-phone {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #e2e8f0 !important;
      }
      .contact-action-phone:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.25);
        color: #ffffff !important;
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    const wrap = document.createElement('div');
    wrap.id = 'contactBubbleWrap';
    wrap.innerHTML = `
      <div id="contactCardPopout" class="contact-card-popout" role="dialog" aria-label="פנייה לנתנאל">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
          <div style="display: flex; items: center; gap: 10px;">
            <div style="position: relative; width: 40px; height: 40px; border-radius: 50%; background: #1e293b; border: 1.5px solid #8AB4FF; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
              👨‍🏫
              <span style="position: absolute; bottom: 0; left: 0; width: 10px; height: 10px; background: #22c55e; border: 2px solid #0d1527; border-radius: 50%;"></span>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #ffffff; line-height: 1.2;">נתנאל, חשבונאוטיקה</div>
              <div style="font-size: 11px; color: #22c55e; font-weight: 600; margin-top: 2px;">זמין עכשיו לשיחה או WhatsApp</div>
            </div>
          </div>
          <button id="contactCardClose" type="button" aria-label="סגירה" style="background: none; border: none; color: rgba(255,255,255,0.6); font-size: 18px; cursor: pointer; padding: 2px 6px; border-radius: 6px; line-height: 1;">✕</button>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.85); margin: 0 0 12px 0;">
          היי, יש לכם שאלה או רוצים לשמוע עוד? אפשר להתקשר אליי או לשלוח הודעה בוואטסאפ. אני כאן, בכיף.
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${WA_URL}" target="_blank" rel="noopener noreferrer" class="contact-action-btn contact-action-wa" id="contactWaLink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
            </svg>
            <span>הודעה בוואטסאפ</span>
          </a>

          <a href="${TEL_URL}" class="contact-action-btn contact-action-phone" id="contactTelLink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>שיחת טלפון: ${DISPLAY_PHONE}</span>
          </a>
        </div>
      </div>

      <button id="contactBtnMain" type="button" class="contact-btn-main" aria-label="פנייה מהירה בוואטסאפ או בטלפון">
        <div class="contact-ripple-halo"></div>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
        </svg>
        <span class="contact-badge-dot" id="contactBadge"></span>
      </button>
    `;

    document.body.appendChild(wrap);

    const card = wrap.querySelector('#contactCardPopout');
    const mainBtn = wrap.querySelector('#contactBtnMain');
    const closeBtn = wrap.querySelector('#contactCardClose');
    const badge = wrap.querySelector('#contactBadge');
    const waLink = wrap.querySelector('#contactWaLink');
    const telLink = wrap.querySelector('#contactTelLink');

    let isOpen = false;
    let autoPopped = false;
    const DISMISS_KEY = 'chashbonautika_contact_dismissed_v1';

    function openCard(triggeredByAuto = false) {
      if (isOpen) return;
      isOpen = true;
      card.classList.add('is-open');
      if (badge) badge.style.display = 'none';
      if (window.gtag) {
        window.gtag('event', 'contact_bubble_show', { auto: triggeredByAuto });
      }
    }

    function closeCard() {
      if (!isOpen) return;
      isOpen = false;
      card.classList.remove('is-open');
      try {
        sessionStorage.setItem(DISMISS_KEY, '1');
      } catch (e) {}
    }

    mainBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isOpen) {
        closeCard();
      } else {
        openCard(false);
      }
    });

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeCard();
    });

    waLink.addEventListener('click', function() {
      if (window.gtag) {
        window.gtag('event', 'contact_whatsapp_click', { method: 'floating_bubble' });
      }
    });

    telLink.addEventListener('click', function() {
      if (window.gtag) {
        window.gtag('event', 'contact_phone_click', { method: 'floating_bubble' });
      }
    });

    // Check if dismissed in this browser session
    const isDismissed = (() => {
      try {
        return sessionStorage.getItem(DISMISS_KEY) === '1';
      } catch (e) {
        return false;
      }
    })();

    if (!isDismissed) {
      // Auto-popup after 3.8s or upon user scrolling down 180px
      const timer = setTimeout(function() {
        if (!autoPopped && !isOpen) {
          autoPopped = true;
          openCard(true);
        }
      }, 3800);

      function handleScroll() {
        if (!autoPopped && !isOpen && window.scrollY > 180) {
          autoPopped = true;
          clearTimeout(timer);
          openCard(true);
          window.removeEventListener('scroll', handleScroll);
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  // Expose globally
  window.initContactBubble = initContactBubble;

  // Auto-init on DOMContentLoaded or immediate if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactBubble);
  } else {
    initContactBubble();
  }
})();
