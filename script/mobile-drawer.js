/* mobile-drawer.js – Logout at bottom, no overlap, profile disabled (no blur) */
(function () {
  const BREAKPOINT = 767;

  /* --------------------------------------------------------------
     1. CREATE ELEMENTS (hamburger, overlay, drawer)
     -------------------------------------------------------------- */
  function createIfMissing() {
    const header = document.querySelector('header.navbar');
    if (!header) return;

    /* ---- Hamburger ---- */
    if (!header.querySelector('#mobile-hamburger')) {
      const btn = document.createElement('button');
      btn.id = 'mobile-hamburger';
      btn.className = 'mobile-hamburger';
      btn.setAttribute('aria-label', 'Open menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.type = 'button';
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('span');
        btn.appendChild(s);
      }
      header.appendChild(btn);
    }

    /* ---- Overlay ---- */
    if (!document.body.querySelector('#mobile-drawer-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'mobile-drawer-overlay';
      overlay.className = 'mobile-drawer-overlay';
      overlay.setAttribute('tabindex', '-1');
      document.body.appendChild(overlay);
    }

    /* ---- Drawer ---- */
    if (!document.body.querySelector('#mobile-drawer')) {
      const drawer = document.createElement('aside');
      drawer.id = 'mobile-drawer';
      drawer.className = 'mobile-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-hidden', 'true');

      /* ---- Header ---- */
      const headerDiv = document.createElement('div');
      headerDiv.className = 'drawer-header';
      headerDiv.innerHTML = `
        <div class="drawer-title">SLU OrgDesk Menu</div>
        <button class="drawer-close" aria-label="Close menu" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      `;
      drawer.appendChild(headerDiv);

      /* ---- Navigation ---- */
      const navWrap = document.createElement('nav');
      navWrap.className = 'drawer-nav';
      navWrap.setAttribute('aria-label', 'Mobile menu');

      const desktopNav = document.querySelector('header.navbar nav');
      if (desktopNav) {
        const desktopUl = desktopNav.querySelector('ul');
        if (desktopUl) {
          const clone = desktopUl.cloneNode(true);
          clone.className = 'drawer-nav-list';

          /* ---- LOGOUT – ALWAYS LAST ---- */
          const logoutLi = document.createElement('li');
          logoutLi.innerHTML = `<a href="#" id="mobileLogoutLink">Logout</a>`;
          clone.appendChild(logoutLi);

          navWrap.appendChild(clone);
        }
      }

      drawer.appendChild(navWrap);
      document.body.appendChild(drawer);

      /* ---- Logout handler (run after DOM is ready) ---- */
      setTimeout(() => {
        const mobileLogout = document.getElementById('mobileLogoutLink');
        if (mobileLogout) {
          mobileLogout.addEventListener('click', e => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../index.html';
          });
        }
      }, 100);
    }
  }

  /* --------------------------------------------------------------
     2. OPEN / CLOSE LOGIC
     -------------------------------------------------------------- */
  function wireActions() {
    const hamburger = document.getElementById('mobile-hamburger');
    const overlay   = document.getElementById('mobile-drawer-overlay');
    const drawer    = document.getElementById('mobile-drawer');
    if (!hamburger || !overlay || !drawer) return;

    const closeBtn = drawer.querySelector('.drawer-close');

    const openDrawer = () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      overlay.classList.add('visible');
      closeBtn?.focus();
      document.documentElement.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('visible');
      document.documentElement.style.overflow = '';
      hamburger.focus();
    };

    if (!hamburger._wired) {
      hamburger.addEventListener('click', () => (drawer.classList.contains('open') ? closeDrawer() : openDrawer()));
      overlay.addEventListener('click', closeDrawer);
      closeBtn?.addEventListener('click', closeDrawer);

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
      });

      drawer.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (a && a.id !== 'mobileLogoutLink') closeDrawer();
      });

      hamburger._wired = true;
    }
  }

  /* --------------------------------------------------------------
     3. SHOW/HIDE + DISABLE PROFILE ON MOBILE (NO BLUR)
     -------------------------------------------------------------- */
  function toggleVisibilityByWidth() {
    const isMobile   = window.innerWidth <= BREAKPOINT;
    const hamburger  = document.getElementById('mobile-hamburger');
    const drawer     = document.getElementById('mobile-drawer');
    const overlay    = document.getElementById('mobile-drawer-overlay');
    const profilePic = document.getElementById('nav-profile-pic');

    // Hamburger / drawer visibility
    if (hamburger) hamburger.style.display = isMobile ? 'inline-flex' : 'none';
    if (drawer)    drawer.style.display    = isMobile ? 'flex'       : 'none';
    if (overlay)   overlay.style.display   = isMobile ? 'block'      : 'none';

    // DISABLE profile click on mobile – NO OPACITY CHANGE
    if (profilePic) {
      profilePic.style.pointerEvents = isMobile ? 'none' : 'auto';
      // Removed: profilePic.style.opacity = ... (no blur!)
    }

    // Auto-close drawer when switching to desktop
    if (!isMobile && drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      hamburger?.setAttribute('aria-expanded', 'false');
      overlay?.classList.remove('visible');
      document.documentElement.style.overflow = '';
    }
  }

  /* --------------------------------------------------------------
     4. INITIALISE
     -------------------------------------------------------------- */
  function init() {
    createIfMissing();
    wireActions();
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