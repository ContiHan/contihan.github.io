// Applies the saved/preferred theme before first paint (prevents theme flash).
// Loaded synchronously in <head>, before the stylesheet, so it runs pre-render.
// Kept as an external file so the CSP can stay `script-src 'self'` (no inline).
(function () {
    var root = document.documentElement;
    // Marks JS as available: scroll-reveal / progress-bar start states are scoped
    // to .js in CSS, so the page stays fully readable with JavaScript disabled
    root.classList.add('js');

    var t = null;
    try {
        t = localStorage.getItem('theme');
    } catch (e) { /* storage unavailable (private mode) */ }
    if (t !== 'light' && t !== 'dark') {
        t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    root.setAttribute('data-theme', t);

    // Mobile browser toolbar color follows the theme (meta sits above this script)
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f4f4f5' : '#050505');
})();
