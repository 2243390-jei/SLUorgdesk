/* mobile-drawer.js
   Injects a hamburger, overlay and right-side drawer on small screens.
   Designed to work with the existing header markup (no HTML edits required).
*/
(function () {
  const BREAKPOINT = 767; // match the CSS @media max-width

  function createIfMissing() {
    const header = document.querySelector('header.navbar');
    if (!header) return;

    // create hamburger (if not present)
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

    // create overlay
    if (!document.body.querySelector('#mobile-drawer-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'mobile-drawer-overlay';
      overlay.className = 'mobile-drawer-overlay';
      overlay.setAttribute('tabindex', '-1');
      document.body.appendChild(overlay);
    }

    // create drawer
    if (!document.body.querySelector('#mobile-drawer')) {
      const drawer = document.createElement('aside');
      drawer.id = 'mobile-drawer';
      drawer.className = 'mobile-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-hidden', 'true');

      // header: use profile img src if available
      const profileImg = (document.querySelector('.profile-icon img') || {}).src || '';
      const headerDiv = document.createElement('div');
      headerDiv.className = 'drawer-header';
      headerDiv.innerHTML = `
        <img src="${profileImg}" alt="Profile" />
        <div class="drawer-title">Menu</div>
        <button class="drawer-close" aria-label="Close menu" type="button">&times;</button>
      `;
      drawer.appendChild(headerDiv);

      // nav area: clone existing nav ul if present
      const navWrap = document.createElement('nav');
      navWrap.className = 'drawer-nav';
      navWrap.setAttribute('aria-label', 'Mobile menu');

      const desktopNav = document.querySelector('header.navbar nav');
      if (desktopNav) {
        const desktopUl = desktopNav.querySelector('ul');
        if (desktopUl) {
          const clone = desktopUl.cloneNode(true);
          navWrap.appendChild(clone);
        } else {
          // fallback: gather anchors
          const links = desktopNav.querySelectorAll('a');
          const ul = document.createElement('ul');
          links.forEach(a => {
            const li = document.createElement('li');
            li.appendChild(a.cloneNode(true));
            ul.appendChild(li);
          });
          navWrap.appendChild(ul);
        }
      } else {
        // fallback static links
        navWrap.innerHTML = '<ul><li><a href="home.html">Home</a></li><li><a href="submission.html">Submission</a></li><li><a href="history.html">History</a></li></ul>';
      }

      drawer.appendChild(navWrap);
      document.body.appendChild(drawer);
    }
  }

  function wireActions() {
    const hamburger = document.getElementById('mobile-hamburger');
    const overlay = document.getElementById('mobile-drawer-overlay');
    const drawer = document.getElementById('mobile-drawer');
    if (!hamburger || !overlay || !drawer) return;

    const closeBtn = drawer.querySelector('.drawer-close');

    function openDrawer() {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      overlay.classList.add('visible');
      if (closeBtn) closeBtn.focus();
      document.documentElement.style.overflow = 'hidden';
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('visible');
      document.documentElement.style.overflow = '';
      hamburger.focus();
    }

    if (!hamburger._wired) {
      hamburger.addEventListener('click', () => {
        if (drawer.classList.contains('open')) closeDrawer(); else openDrawer();
      });
      overlay.addEventListener('click', closeDrawer);
      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

      // close on Esc
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
      });

      // close when clicking a link inside the drawer
      drawer.addEventListener('click', function (e) {
        const a = e.target.closest('a');
        if (a) closeDrawer();
      });

      hamburger._wired = true;
    }
  }

  function toggleVisibilityByWidth() {
    const isMobile = window.innerWidth <= BREAKPOINT;
    const hamburger = document.getElementById('mobile-hamburger');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');

    if (hamburger) hamburger.style.display = isMobile ? 'inline-flex' : 'none';
    if (drawer) drawer.style.display = isMobile ? 'flex' : 'none';
    if (overlay) overlay.style.display = isMobile ? 'block' : 'none';

    if (!isMobile && drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('visible');
      document.documentElement.style.overflow = '';
    }
  }

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
