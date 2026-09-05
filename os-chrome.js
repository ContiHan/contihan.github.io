// Terminal window chrome matches the visitor's OS.
// macOS traffic lights are the CSS default; Windows/Linux get their own look.
// Shared by index.html and 404.html — loaded at the end of <body>.
(function () {
    var ua = navigator.userAgent;
    var cls = '';
    if (/Windows/i.test(ua)) {
        cls = 'os-windows';
    } else if (/Linux|X11|Android|CrOS/i.test(ua) && !/Mac OS X/i.test(ua)) {
        cls = 'os-linux';
    }
    if (!cls) return;
    document.querySelectorAll('.terminal-window').forEach(function (w) {
        w.classList.add(cls);
    });
})();
