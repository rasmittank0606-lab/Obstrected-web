/**
 * OBSTRECTED — Session Guard (API-backed)
 * Included in <head> of every protected page.
 * Checks /api/auth/me; redirects to /index.html if not authenticated.
 */

// Hide page immediately to prevent content flash
document.documentElement.style.visibility = 'hidden';

// Fetch auth state from backend
fetch('/api/auth/me')
    .then(function (r) {
        if (!r.ok) throw new Error('not auth');
        return r.json();
    })
    .then(function (data) {
        window._authUser = data.user;           // Make user available to page scripts
        setupNav(data.user);
        document.documentElement.style.visibility = '';
    })
    .catch(function () {
        window.location.replace('/index.html');
    });

function setupNav(user) {
    // Run when DOM is ready
    function onReady() {
        const isArch = user.role === 'architect';

        // ── Fix all panel link hrefs and text ─────────────────────────────
        document.querySelectorAll('nav a, header nav a').forEach(function (a) {
            const href = (a.getAttribute('href') || '').toLowerCase();
            const txt  = a.textContent.trim().toLowerCase();

            if (href.includes('architect_login') || href.includes('architect_dashboard') ||
                txt.includes('architect panel')  || txt.includes('architecture panel')) {
                a.setAttribute('href', '/architect_dashboard.html');
                a.textContent = 'Architecture Panel';
                a.classList.add('_nav-arch-panel');
            }
            if (href.includes('customer_login') || href.includes('customer_dashboard') ||
                txt.includes('customer panel')) {
                a.setAttribute('href', '/customer_dashboard.html');
                a.textContent = 'Customer Panel';
                a.classList.add('_nav-cust-panel');
            }
        });

        // ── Role-based visibility ─────────────────────────────────────────
        if (isArch) {
            // Architect: Portfolios, Projects, Architecture Panel, Sign Out ONLY
            const archHide = ['home.html', 'about.html', 'contact.html', 'book_appointment'];
            document.querySelectorAll('nav li').forEach(function (li) {
                const a    = li.querySelector('a');
                if (!a) return;
                const href = (a.getAttribute('href') || '').toLowerCase();
                const txt  = a.textContent.trim().toLowerCase();
                if (archHide.some(h => href.includes(h)) ||
                    txt === 'home' || txt === 'about' || txt === 'contact' || txt === 'book appointment') {
                    li.style.display = 'none';
                }
            });
            document.querySelectorAll('._nav-cust-panel').forEach(function (el) {
                const li = el.closest('li');
                if (li) li.style.display = 'none';
            });

            // ── Normalize text for allowed links ──────────────────────────
            document.querySelectorAll('nav li a').forEach(function (a) {
                const txt = a.textContent.trim().toLowerCase();
                if (txt === 'portfolios') a.textContent = 'Portfolios';
                if (txt === 'projects') a.textContent = 'Projects';
            });

            // ── Inject "Detail" after "Architecture Panel" ────────────────
            const archPanelLink = document.querySelector('._nav-arch-panel');
            if (archPanelLink) {
                const archLi = archPanelLink.closest('li');
                // Check if Detail already exists to prevent duplicates
                let hasDetail = false;
                document.querySelectorAll('nav li a').forEach(a => {
                    if (a.textContent.trim().toLowerCase() === 'detail') hasDetail = true;
                });

                if (!hasDetail && archLi) {
                    const detailLi = document.createElement('li');
                    const detailA = document.createElement('a');
                    detailA.href = '/architect_dashboard.html#detailSection';
                    detailA.textContent = 'Detail';
                    detailLi.appendChild(detailA);
                    archLi.parentNode.insertBefore(detailLi, archLi.nextSibling);
                }
            }
        } else {
            // Customer: hide Architecture Panel
            document.querySelectorAll('._nav-arch-panel').forEach(function (el) {
                const li = el.closest('li');
                if (li) li.style.display = 'none';
            });
            // Hide Detail if it exists for customers
            document.querySelectorAll('nav li a').forEach(a => {
                if (a.textContent.trim().toLowerCase() === 'detail') {
                    const li = a.closest('li');
                    if (li) li.style.display = 'none';
                }
            });
        }

        // ── Inject Sign Out link as last nav item ─────────────────────────
        const navUl = document.querySelector('nav ul');
        if (navUl) {
            // Prevent green ::after underline on sign-out link
            const noLine = document.createElement('style');
            noLine.textContent = 'nav ul li a[href="/index.html"]::after { display:none!important; }';
            document.head.appendChild(noLine);

            const li = document.createElement('li');
            const a  = document.createElement('a');
            a.href = '/index.html';
            a.textContent = '🚪 Sign Out';
            a.style.cssText = 'color:rgba(255,255,255,0.7);font-weight:500;cursor:pointer;';
            a.addEventListener('mouseenter', function () { a.style.color = '#dc3545'; });
            a.addEventListener('mouseleave', function () { a.style.color = 'rgba(255,255,255,0.7)'; });
            a.addEventListener('click', function (e) {
                e.preventDefault();
                fetch('/api/auth/logout', { method: 'POST' })
                    .finally(function () { window.location.href = '/index.html'; });
            });
            li.appendChild(a);
            navUl.appendChild(li);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
}
