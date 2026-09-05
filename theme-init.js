// Applies the saved/preferred theme before first paint (prevents theme flash).
// Loaded synchronously in <head>, before the stylesheet, so it runs pre-render.
// Kept as an external file so the CSP can stay `script-src 'self'` (no inline).
(function () {
    try {
        var t = localStorage.getItem('theme');
        if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', t);
    } catch (e) { /* storage unavailable (private mode) — keep default */ }
})();
