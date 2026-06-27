const fs = require('fs');

// --- 1. Fix CSS ---
let css = fs.readFileSync('style.css', 'utf8');

// A. Fix Audio Toggle matching Theme Toggle
css = css.replace(/\/\* Audio Toggle \*\/[\s\S]*?\.audio-toggle:hover\s*{[^}]*}[\s\S]*?@media\s*\(max-width:\s*768px\)\s*{\s*\.audio-toggle\s*{[^}]*}\s*}/g, `/* Audio Toggle */
.audio-toggle {
    position: fixed;
    bottom: 90px;
    right: 30px;
    z-index: 1000;
    background: var(--surface-color);
    color: var(--text-primary);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    transition: all 0.3s ease;
    border: 1px solid var(--border-color);
}
.audio-toggle:hover {
    transform: scale(1.1) rotate(15deg);
    background: var(--accent-color);
    color: var(--bg-color);
}
@media (max-width: 768px) {
    .audio-toggle {
        bottom: 75px;
        right: 20px;
        width: 45px;
        height: 45px;
    }
}`);

// B. Fix Scroll Progress Bar
css = css.replace(/#scroll-progress\s*{[^}]*}/g, `#scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 4px;
    background: #00ffcc;
    box-shadow: 0 0 15px #00ffcc, 0 0 30px #00ffcc;
    z-index: 9999999;
    transition: width 0.1s ease;
}`);

// C. Fix Custom Cursor
// Remove the media query wrapping the cursor css
css = css.replace(/@media\s*\(pointer:\s*fine\)\s*{\s*body,\s*a,\s*button,\s*input\s*{\s*cursor:\s*none\s*!important;\s*}\s*\.custom-cursor/g, `
/* Dynamic cursor classes */
body.has-mouse, body.has-mouse a, body.has-mouse button, body.has-mouse input {
    cursor: none !important;
}
.custom-cursor`);
css = css.replace(/border-color:\s*#ff00ff;\s*}\s*}/g, `border-color: #ff00ff;\n}`); // remove closing bracket of media query

// D. Fix Terminal Mobile Scrollbar
css = css.replace(/\.terminal-body\s*{[^}]*}/g, `.terminal-body {
    padding: 20px;
    color: #00ffcc;
    height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    font-size: 1rem;
    line-height: 1.5;
}
@media (max-width: 768px) {
    .terminal-body {
        height: 200px;
    }
}`);

fs.writeFileSync('style.css', css);


// --- 2. Fix JS ---
let js = fs.readFileSync('script.js', 'utf8');

// A. Update scroll progress to ensure it works
js = js.replace(/const docHeight = Math\.max\(document\.body\.scrollHeight, document\.documentElement\.scrollHeight\) - window\.innerHeight;/g, `
        const bodyScroll = document.body.scrollHeight || 0;
        const docScroll = document.documentElement.scrollHeight || 0;
        const totalHeight = Math.max(bodyScroll, docScroll);
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const docHeight = totalHeight - windowHeight;
`);

// B. Add has-mouse detector
if (!js.includes('has-mouse')) {
    js = js.replace(/document\.addEventListener\('mousemove',\s*\(e\)\s*=>\s*{/g, `
    document.addEventListener('mousemove', function mouseDetector(e) {
        document.body.classList.add('has-mouse');
        document.removeEventListener('mousemove', mouseDetector);
    });
    
    document.addEventListener('mousemove', (e) => {`);
}

// C. Move Matrix to Terminal and simplify Konami
const newKonami = `
    function triggerKonami() {
        playBeep(200, 'sawtooth', 0.5);
        playBeep(400, 'sawtooth', 0.5, 0.5);
        playBeep(600, 'sawtooth', 0.5, 1.0);
        
        document.body.classList.add('theme-transition-glitch');
        
        // Let it glitch for 3 seconds then recover
        setTimeout(() => {
            document.body.classList.remove('theme-transition-glitch');
        }, 3000);
    }
    
    // Matrix Easter Egg for Terminal
    function triggerMatrix() {
        playBeep(300, 'square', 1.0);
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'black';
        overlay.style.zIndex = '9999999';
        
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';
        overlay.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\\'#&_(),.;:?!\\\\|{}<>[]^~'.split('');
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = [];
        for(let x = 0; x < columns; x++) drops[x] = 1;
        
        const matrixInterval = setInterval(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';
            for(let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }, 33);
        
        // Allow user to click to dismiss
        overlay.style.cursor = 'pointer';
        overlay.addEventListener('click', () => {
            clearInterval(matrixInterval);
            overlay.remove();
        });
        document.body.appendChild(overlay);
    }
`;

// Replace the old triggerKonami and matrix logic
js = js.replace(/function triggerKonami\(\)\s*{[\s\S]*?}\s*}\);\s*$/g, newKonami + "\n});\n");

// Add 'matrix' command to terminal
js = js.replace(/case 'clear':/g, `case 'matrix':
                    printTerminalLine('Initializing Matrix protocol...');
                    setTimeout(triggerMatrix, 1000);
                    break;
                case 'clear':`);

fs.writeFileSync('script.js', js);
console.log('Fixes applied successfully!');
