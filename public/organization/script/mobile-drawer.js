/* Mobile sheet script: create sheet and wire hamburger */
(function () {
  const BREAKPOINT = 767;

  function createSheetIfMissing() {
    if (document.getElementById('mobileSheet')) return;

    const sheet = document.createElement('div');
    sheet.id = 'mobileSheet';
    sheet.className = 'mobile-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-hidden', 'true');

    const overlay = document.createElement('div');
    overlay.id = 'sheetOverlay';
    overlay.className = 'sheet-overlay';
    sheet.appendChild(overlay);

    const panel = document.createElement('div');
    panel.className = 'sheet-panel';

    const handle = document.createElement('div');
    handle.id = 'sheetHandle';
    handle.className = 'sheet-handle';
    panel.appendChild(handle);

    const inner = document.createElement('div');
    inner.className = 'sheet-inner';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'sheet-header';
    headerDiv.innerHTML = `
      <div class="mobile-profile">
        <img id="mobileProfilePic" src="../images/student_img/profile.png" alt="Profile">
        <div class="mobile-profile-info">
          <h3 id="mobileProfileName">Loading...</h3>
          <p id="mobileProfileEmail">&nbsp;</p>
        </div>
      </div>
    `;
    inner.appendChild(headerDiv);

    const body = document.createElement('div');
    body.className = 'sheet-body';
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.innerHTML = `
      <ul>
        <li><a href="submission.php">Submission</a></li>
        <li><a href="history.php">History</a></li>
      </ul>
    `;
    body.appendChild(nav);
    inner.appendChild(body);

    const logoutWrap = document.createElement('div');
    logoutWrap.className = 'mobile-logout';
    logoutWrap.innerHTML = `<button id="mobileLogoutButton">Logout</button>`;
    inner.appendChild(logoutWrap);

    panel.appendChild(inner);
    sheet.appendChild(panel);
    document.body.appendChild(sheet);
    // wire logout button and try to populate profile fields from session
    setTimeout(() => {
      const mobileLogout = document.getElementById('mobileLogoutButton');
      if (mobileLogout) {
        mobileLogout.addEventListener('click', e => {
          e.preventDefault();
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '../../index.php';
        });
      }

      // Fetch current session user (uses same-origin credentials so PHP session cookie is sent)
      (function fetchMobileProfile() {
        const nameEl = document.getElementById('mobileProfileName');
        const emailEl = document.getElementById('mobileProfileEmail');
        const picEl = document.getElementById('mobileProfilePic');
        if (!nameEl || !emailEl) return;

        fetch('../../php-server/routes/auth.php?me', { credentials: 'same-origin' })
          .then(r => r.json())
          .then(json => {
            if (json && json.success && json.data) {
              const user = json.data || {};
              const name = user.name || (user.fullname || 'Student');
              const email = user.email || '';
              nameEl.textContent = name;
              emailEl.textContent = email;

              // If user object includes a profile image path, set it (common key: avatar or photo)
              if (user.avatar) picEl.src = user.avatar;
              if (user.photo) picEl.src = user.photo;
            } else {
              nameEl.textContent = 'Student';
              emailEl.textContent = '';
            }
          })
          .catch(() => {
            // silent fail — keep placeholders
            if (nameEl) nameEl.textContent = 'Student';
          });
      })();
    }, 50);
  }

  function wire() {
    const hamburger = document.getElementById('hamburgerBtn') || document.getElementById('mobile-hamburger');
    const sheet = document.getElementById('mobileSheet');
    const overlay = document.getElementById('sheetOverlay');
    const handle = document.getElementById('sheetHandle');
    if (!hamburger || !sheet) return;

    const open = () => {
      sheet.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
    };
    const close = () => {
      sheet.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      try { hamburger.focus(); } catch (e) {}
    };

    hamburger.addEventListener('click', e => {
      e.preventDefault();
      sheet.classList.contains('open') ? close() : open();
    });

    if (overlay) overlay.addEventListener('click', close);
    if (handle) handle.addEventListener('click', close);

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sheet.classList.contains('open')) close();
    });

    sheet.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (a && a.id !== 'mobileLogoutButton') close();
    });
  }

  function toggleVisibilityByWidth() {
    const isMobile = window.innerWidth <= BREAKPOINT;
    const hamburger = document.getElementById('hamburgerBtn') || document.getElementById('mobile-hamburger');
    const sheet = document.getElementById('mobileSheet');
    const overlay = document.getElementById('sheetOverlay');
    if (hamburger) hamburger.style.display = isMobile ? 'inline-flex' : 'none';
    if (sheet) sheet.style.display = isMobile ? 'block' : 'none';
    if (overlay) overlay.style.display = isMobile ? 'block' : 'none';

    if (!isMobile && sheet && sheet.classList.contains('open')) {
      sheet.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      hamburger?.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
    }
  }

  function init() {
    createSheetIfMissing();
    wire();
    toggleVisibilityByWidth();
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(toggleVisibilityByWidth, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();