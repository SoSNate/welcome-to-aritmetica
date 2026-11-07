/**
 * contact-bubble.js — Minimalist Floating WhatsApp & Quick Access Button
 *
 * Provides a clean, minimalist floating button in the bottom-left corner that
 * rotates between:
 * 1. WhatsApp direct chat ("זמינים עבורכם בווטסאפ לכל נושא")
 * 2. Instant access to the system ("כניסה מהירה למערכת")
 *
 * Perfectly anchored in the bottom-left corner with zero horizontal shift.
 */
(function() {
  function initContactBubble() {
    if (document.getElementById('contactBubbleWrap')) return;

    const WA_NUMBER = '972552569496';
    const WA_MESSAGE = encodeURIComponent('היי נתנאל, הגעתי מדף הנחיתה של חשבונאוטיקה ואשמח לשמוע פרטים נוספים 🚀');
    const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;
    const START_URL = 'https://aritmetica.nt-school.app/';
    const DISMISS_BALLOON_KEY = 'chashbonautika_balloon_dismissed_v2';

    const styles = `
      #contactBubbleWrap {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 220;
        font-family: 'Heebo', system-ui, -apple-system, sans-serif;
        direction: ltr; /* Ensure alignment to the left corner */
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        user-select: none;
        isolation: isolate;
      }
      .cb-balloon {
        position: relative;
        margin-bottom: 10px;
        max-width: 280px;
        background: rgba(12, 20, 39, 0.95);
        border: 1px solid rgba(138, 180, 255, 0.3);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 8px 14px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 16px rgba(37, 211, 102, 0.15);
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.35;
        direction: rtl;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      .cb-balloon.cb-hidden {
        opacity: 0;
        transform: translateY(8px) scale(0.95);
        pointer-events: none;
      }
      .cb-balloon::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 20px;
        width: 12px;
        height: 12px;
        background: #0c1427;
        border-right: 1px solid rgba(138, 180, 255, 0.3);
        border-bottom: 1px solid rgba(138, 180, 255, 0.3);
        transform: rotate(45deg);
      }
      .cb-balloon-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .cb-balloon-text {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
      .cb-balloon-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.45);
        font-size: 15px;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 6px;
        line-height: 1;
        transition: color 0.15s ease;
      }
      .cb-balloon-close:hover {
        color: #ffffff;
      }
      .cb-pulse-dot {
        position: relative;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #22c55e;
        flex-shrink: 0;
      }
      .cb-pulse-dot::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background-color: rgba(34, 197, 94, 0.5);
        animation: cb-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
      @keyframes cb-ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }
      .cb-sparkle {
        font-size: 14px;
        flex-shrink: 0;
      }
      .cb-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 0 18px 0 16px;
        height: 48px;
        border-radius: 9999px;
        font-size: 14px;
        font-weight: 800;
        text-decoration: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        transition: background 0.35s ease, box-shadow 0.35s ease, transform 0.2s ease;
        cursor: pointer;
        outline: none;
        white-space: nowrap;
        direction: rtl;
      }
      .cb-btn:hover {
        transform: translateY(-2px);
      }
      .cb-btn:active {
        transform: scale(0.96);
      }
      .cb-btn-wa {
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        color: #ffffff !important;
        box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4);
      }
      .cb-btn-quick {
        background: linear-gradient(135deg, #5EEAD4 0%, #8AB4FF 100%);
        color: #070b14 !important;
        box-shadow: 0 8px 24px rgba(94, 234, 212, 0.4);
      }
      .cb-icon-wrap {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .cb-btn-wa .cb-icon-wrap {
        background: rgba(255, 255, 255, 0.22);
      }
      .cb-btn-quick .cb-icon-wrap {
        background: rgba(0, 0, 0, 0.12);
        font-size: 15px;
      }
      @media (max-width: 640px) {
        #contactBubbleWrap {
          bottom: 18px;
          left: 16px;
        }
        .cb-balloon {
          max-width: 260px;
          font-size: 12px;
          padding: 6px 12px;
        }
        .cb-btn {
          height: 44px;
          font-size: 13px;
          padding: 0 16px 0 14px;
        }
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    let isDismissed = false;
    try {
      isDismissed = sessionStorage.getItem(DISMISS_BALLOON_KEY) === '1';
    } catch (e) {}

    const wrap = document.createElement('div');
    wrap.id = 'contactBubbleWrap';

    wrap.innerHTML = `
      <div id="cbBalloon" class="cb-balloon ${isDismissed ? 'cb-hidden' : ''}" role="status" aria-live="polite">
        <div class="cb-balloon-content">
          <div class="cb-balloon-text" id="cbBalloonText">
            <span class="cb-pulse-dot" id="cbDot"></span>
            <span id="cbMsg">זמינים עבורכם בווטסאפ לכל נושא</span>
          </div>
          <button type="button" class="cb-balloon-close" id="cbCloseBtn" aria-label="סגירת הודעה">✕</button>
        </div>
      </div>

      <a href="${WA_URL}" target="_blank" rel="noopener noreferrer" class="cb-btn cb-btn-wa" id="cbBtn" aria-label="פנייה ישירה בווטסאפ לכל נושא">
        <span class="cb-icon-wrap" id="cbIcon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
          </svg>
        </span>
        <span id="cbBtnTxt">פנייה בווטסאפ</span>
      </a>
    `;

    document.body.appendChild(wrap);

    const balloon = wrap.querySelector('#cbBalloon');
    const msg = wrap.querySelector('#cbMsg');
    const dot = wrap.querySelector('#cbDot');
    const closeBtn = wrap.querySelector('#cbCloseBtn');
    const btn = wrap.querySelector('#cbBtn');
    const btnTxt = wrap.querySelector('#cbBtnTxt');
    const icon = wrap.querySelector('#cbIcon');

    const waIconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
      </svg>
    `;

    let currentMode = 'wa';
    let isHovered = false;

    wrap.addEventListener('mouseenter', function() { isHovered = true; });
    wrap.addEventListener('mouseleave', function() { isHovered = false; });

    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      balloon.classList.add('cb-hidden');
      try {
        sessionStorage.setItem(DISMISS_BALLOON_KEY, '1');
      } catch (err) {}
    });

    function setMode(mode) {
      currentMode = mode;
      if (mode === 'wa') {
        btn.className = 'cb-btn cb-btn-wa';
        btn.href = WA_URL;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.setAttribute('aria-label', 'פנייה ישירה בווטסאפ לכל נושא');
        btnTxt.textContent = 'פנייה בווטסאפ';
        icon.innerHTML = waIconSvg;

        if (dot) dot.style.display = 'block';
        if (msg) msg.textContent = 'זמינים עבורכם בווטסאפ לכל נושא';
      } else {
        btn.className = 'cb-btn cb-btn-quick';
        btn.href = START_URL;
        btn.target = '_self';
        btn.removeAttribute('rel');
        btn.setAttribute('aria-label', 'כניסה מהירה למערכת חשבונאוטיקה');
        btnTxt.textContent = 'כניסה מהירה למערכת';
        icon.innerHTML = '🚀';

        if (dot) dot.style.display = 'none';
        if (msg) msg.textContent = 'מעוניינים להירשם מיד? כניסה מהירה';
      }
    }

    // Rotate every 4.5 seconds
    setInterval(function() {
      if (isHovered || document.hidden) return;
      setMode(currentMode === 'wa' ? 'quick' : 'wa');
    }, 4500);

    btn.addEventListener('click', function() {
      if (window.gtag) {
        window.gtag('event', currentMode === 'wa' ? 'contact_whatsapp_click' : 'contact_quick_access_click', {
          method: 'floating_bubble'
        });
      }
    });
  }

  // Expose globally
  window.initContactBubble = initContactBubble;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactBubble);
  } else {
    initContactBubble();
  }
})();
