/* ===========================================
   Prevent scroll restoration on refresh
   (skipped for hash deep links like /#projects)
=========================================== */
if ('scrollRestoration' in history && !location.hash) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===========================================
    // Scroll lock (shared by mobile menu, Matrix and Konami)
    // iOS Safari ignores overflow:hidden on <body>, so the lock uses the
    // position:fixed technique and restores the scroll position on unlock.
    // A counter handles overlapping locks (e.g. Konami while the menu is open).
    // ===========================================
    let scrollLockCount = 0;
    let scrollLockY = 0;

    function lockScroll() {
        scrollLockCount++;
        if (scrollLockCount > 1) return;
        scrollLockY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        if (scrollLockCount === 0) return;
        scrollLockCount--;
        if (scrollLockCount > 0) return;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo({ top: scrollLockY, left: 0, behavior: 'instant' });
    }

    // ===========================================
    // 1. Typewriter Effect
    // ===========================================
    // Models a human typist instead of uniform random delays. Timings follow
    // Dhakal et al., "Observations on Typing from 136 Million Keystrokes"
    // (CHI 2018): the average typist does 52 WPM with ~239 ms between
    // keystrokes, intervals are right-skewed with a ~60 ms floor, and errors
    // are mostly substitutions (1.65%), then omissions (0.8%), insertions (0.67%).
    const typewriterElement = document.getElementById('typewriter');
    const texts = [
        "Running statistical analysis...",
        "Searching for security vulnerabilities...",
        "Executing performance tests...",
        "May the Force be with you."
    ];

    const TYPE_WPM = 81;                      // target speed (study average: 52)
    const TYPE_TEMPO = 52 / TYPE_WPM;         // timings below are calibrated at 52 WPM
    const TYPE_BASE_IKI_MS = 200;             // median keystroke interval at 52 WPM
    const TYPE_MIN_IKI_MS = 60;               // physical floor observed in the study
    const TYPE_ERROR_CHANCE = 0.65;           // share of phrases that get one typo
    const TYPE_HOLD_MS = [1900, 2600];        // reading pause before deleting
    const TYPE_NEXT_MS = [380, 750];          // pause before the next phrase
    const BACKSPACE_REPEAT_DELAY_MS = [330, 420]; // OS key-repeat delay (held Backspace)
    const BACKSPACE_REPEAT_MS = [31, 37];         // OS key-repeat rate

    // Error kinds, weighted by the study's error mix; three span several characters
    const TYPO_KINDS = [
        ['neighbor', 28],   // one wrong key next to the right one
        ['handShift', 15],  // 2–4 letters typed with the hand shifted one key over
        ['swap', 10],       // two letters transposed ("teh")
        ['omit', 26],       // a letter skipped, noticed a few letters later
        ['insert', 21],     // an extra letter (doubled or neighbor)
    ];
    const KEY_NEIGHBORS = {
        a: 'qwsz', b: 'vghn', c: 'xdfv', d: 'serfcx', e: 'wsdr', f: 'drtgvc', g: 'ftyhbv',
        h: 'gyujnb', i: 'ujko', j: 'huikmn', k: 'jiolm', l: 'kop', m: 'njk', n: 'bhjm',
        o: 'iklp', p: 'ol', q: 'wa', r: 'edft', s: 'awedxz', t: 'rfgy', u: 'yhji',
        v: 'cfgb', w: 'qase', x: 'zsdc', y: 'tghu', z: 'asx'
    };
    const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const between = (min, max) => min + Math.random() * (max - min);
    const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

    // Standard normal sample (Box–Muller) for log-normal keystroke intervals
    function gaussian() {
        let u = 0, v = 0;
        while (!u) u = Math.random();
        while (!v) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function shiftedKey(ch, dir) {
        for (const row of KEY_ROWS) {
            const i = row.indexOf(ch);
            if (i >= 0) return row[i + dir] || row[i - dir];
        }
        return ch;
    }

    // Per character: position inside its word (0 = not a letter) and how many
    // lowercase letters follow from here to the end of the word
    function analyzeWords(text) {
        const pos = [];
        const lettersLeft = [];
        let p = 0;
        for (let i = 0; i < text.length; i++) {
            p = /[A-Za-z]/.test(text[i]) ? p + 1 : 0;
            pos.push(p);
        }
        for (let i = 0; i < text.length; i++) {
            let k = 0;
            while (/[a-z]/.test(text[i + k] || '')) k++;
            lettersLeft.push(k);
        }
        return { pos, lettersLeft };
    }

    // Delay before a keystroke, in ms
    function keystrokeDelay(ch, prev, posInWord, slowdown) {
        let d = TYPE_BASE_IKI_MS * Math.exp(0.35 * gaussian());
        if (posInWord >= 3) d *= 0.92;                        // flow inside a word
        if (ch === prev && /[a-z]/.test(ch)) d *= 0.8;        // repeated letter is quicker
        if (ch === ' ') d *= 0.85;                            // thumb on the space bar
        if (prev === ' ' && ch !== ' ') {
            d += Math.random() < 0.6 ? between(120, 350) : between(20, 80); // next word
        }
        if (/[A-Z]/.test(ch)) d += between(80, 160);          // Shift
        if (ch === '.') d = prev === '.' ? d * 0.75 : d + between(150, 350);
        return Math.max(d * TYPE_TEMPO * slowdown, TYPE_MIN_IKI_MS);
    }

    // Decide whether (and where) this phrase gets a typo
    function planTypo(text, words) {
        if (Math.random() > TYPE_ERROR_CHANCE) return null;
        let roll = Math.random() * 100;
        let kind = TYPO_KINDS[0][0];
        for (const [k, weight] of TYPO_KINDS) {
            if (roll < weight) { kind = k; break; }
            roll -= weight;
        }
        const lettersNeeded = { neighbor: 1, handShift: 2, swap: 2, omit: 3, insert: 1 }[kind];
        const candidates = [];
        for (let i = 0; i < text.length; i++) {
            if (words.pos[i] >= 2 && KEY_NEIGHBORS[text[i]] && words.lettersLeft[i] >= lettersNeeded &&
                !(kind === 'swap' && text[i] === text[i + 1])) {
                candidates.push(i);
            }
        }
        return candidates.length ? { at: pickOne(candidates), kind } : null;
    }

    // What actually gets typed instead of the correct letters, and how many it replaces
    function typoKeystrokes(text, i, kind, words) {
        const ch = text[i];
        switch (kind) {
            case 'neighbor':
                return { typed: pickOne(KEY_NEIGHBORS[ch]), replaces: 1 };
            case 'handShift': {
                const count = Math.min(words.lettersLeft[i], 2 + Math.floor(Math.random() * 3));
                const dir = Math.random() < 0.5 ? 1 : -1;
                let typed = '';
                for (let j = 0; j < count; j++) typed += shiftedKey(text[i + j], dir);
                return { typed, replaces: count };
            }
            case 'swap':
                return { typed: text[i + 1] + ch, replaces: 2 };
            case 'omit':
                return { typed: '', replaces: 1 };
            default: // insert
                return { typed: ch + (Math.random() < 0.5 ? ch : pickOne(KEY_NEIGHBORS[ch])), replaces: 1 };
        }
    }

    async function typePhrase(text) {
        const words = analyzeWords(text);
        let typo = planTypo(text, words);
        let shown = '';
        let carefulKeys = 0; // typing slows down for a few keys after a correction

        const press = async (ch, prev, posInWord) => {
            await sleep(keystrokeDelay(ch, prev, posInWord, carefulKeys > 0 ? 1.15 : 1));
            if (carefulKeys > 0) carefulKeys--;
            shown += ch;
            typewriterElement.textContent = shown;
        };

        for (let i = 0; i < text.length; i++) {
            if (typo && typo.at === i) {
                const { typed, replaces } = typoKeystrokes(text, i, typo.kind, words);
                // Keep going for a few letters before noticing (always ≥1 for an
                // omission, otherwise the mistake would never be visible)
                const lettersAfter = words.lettersLeft[i] - replaces;
                const keepGoing = Math.min(lettersAfter, (typo.kind === 'omit' ? 1 : 0) + Math.floor(Math.random() * 3));
                const wrong = typed + text.slice(i + replaces, i + replaces + keepGoing);

                for (let j = 0; j < wrong.length; j++) {
                    await press(wrong[j], j ? wrong[j - 1] : text[i - 1], words.pos[i] + j);
                }
                await sleep(between(350, 750) * TYPE_TEMPO);             // "wait, that's wrong"
                for (let j = 0; j < wrong.length; j++) {                 // deliberate Backspace taps
                    await sleep(Math.max(between(150, 220) * TYPE_TEMPO, TYPE_MIN_IKI_MS));
                    shown = shown.slice(0, -1);
                    typewriterElement.textContent = shown;
                }
                await sleep(between(150, 280));
                carefulKeys = 3;
                typo = null;
            }
            await press(text[i], text[i - 1] || ' ', words.pos[i]);
        }
    }

    // Held Backspace: one deletion, the OS repeat delay, then fast auto-repeat
    async function holdBackspace(text) {
        let shown = text.slice(0, -1);
        typewriterElement.textContent = shown;
        await sleep(between(...BACKSPACE_REPEAT_DELAY_MS));
        while (shown.length) {
            shown = shown.slice(0, -1);
            typewriterElement.textContent = shown;
            await sleep(between(...BACKSPACE_REPEAT_MS));
        }
    }

    async function runTypewriter() {
        await sleep(1000);
        for (let i = 0; ; i = (i + 1) % texts.length) {
            // Solid cursor while keys are moving, blinking only when idle
            typewriterElement.classList.add('typing');
            await typePhrase(texts[i]);
            typewriterElement.classList.remove('typing');
            await sleep(between(...TYPE_HOLD_MS));

            typewriterElement.classList.add('typing');
            await holdBackspace(texts[i]);
            typewriterElement.classList.remove('typing');
            await sleep(between(...TYPE_NEXT_MS));
        }
    }

    if (prefersReducedMotion) {
        typewriterElement.textContent = texts[0];
    } else {
        runTypewriter();
    }


    // ===========================================
    // 2. Scroll Reveal Animation
    // ===========================================
    const revealElements = document.querySelectorAll('.section-reveal');

    const revealCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };

    // threshold 0 + negative bottom margin: a ratio-based threshold (e.g. 0.15)
    // can never be met by a section taller than ~6.5 viewports — the Projects
    // section on a landscape phone stayed invisible forever.
    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0,
        rootMargin: "0px 0px -15% 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ===========================================
    // 3. Theme Toggle
    // ===========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeIconUse = themeToggleBtn.querySelector('use');

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    // Sun/moon live in the shared sprite — swap the <use> reference, keep the
    // mobile browser toolbar color in sync, and say what the button WILL do
    function updateIcon(theme) {
        const isLight = theme === 'light';
        themeIconUse.setAttribute('href', isLight ? 'assets/icons.svg#i-moon' : 'assets/icons.svg#i-sun');
        themeToggleBtn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
        if (themeColorMeta) themeColorMeta.setAttribute('content', isLight ? '#f4f4f5' : '#050505');
    }

    // Theme attribute is already set pre-paint by theme-init.js in <head>;
    // here we only sync the icon with it.
    updateIcon(htmlElement.getAttribute('data-theme') || 'dark');

    // Until the visitor picks a theme explicitly, follow OS light/dark switches live
    const hasStoredTheme = () => {
        try {
            return localStorage.getItem('theme') !== null;
        } catch (e) {
            return false;
        }
    };
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (hasStoredTheme()) return;
        const osTheme = e.matches ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', osTheme);
        updateIcon(osTheme);
    });

    let themeFlashTimeout;
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) { /* storage unavailable */ }
        updateIcon(newTheme);

        // Gentle flash on theme switch (no strobe — photosensitivity-safe)
        if (!prefersReducedMotion) {
            clearTimeout(themeFlashTimeout);
            document.body.classList.remove('theme-flash');
            void document.body.offsetWidth; // restart animation
            document.body.classList.add('theme-flash');
            themeFlashTimeout = setTimeout(() => {
                document.body.classList.remove('theme-flash');
            }, 500);
        }

        playBeep(200, 'sawtooth', 0.2);
    });


    // ===========================================
    // 4. Skills Progress Animation
    // ===========================================
    const progressBars = document.querySelectorAll('.progress');
    const progressObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Target width lives in the inline --w custom property, so the
                // bars show their real values even without JS
                entry.target.classList.add('filled');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => progressObserver.observe(bar));


    // ===========================================
    // 5. Audio System
    // ===========================================
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;
    let isMuted = true; // start muted (browser autoplay policy)

    const initAudio = () => {
        // Creating (and resuming) the context on the first user gesture
        // unlocks audio on mobile browsers.
        if (!audioContext) {
            audioContext = new AudioContextClass();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    };
    document.addEventListener('pointerdown', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    const audioToggleBtn = document.getElementById('audio-toggle');

    if (audioToggleBtn) {
        const audioIconUse = audioToggleBtn.querySelector('use');
        audioToggleBtn.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new AudioContextClass();
            }

            isMuted = !isMuted;
            audioToggleBtn.setAttribute('aria-pressed', String(!isMuted));
            if (isMuted) {
                audioIconUse.setAttribute('href', 'assets/icons.svg#i-volume-xmark');
            } else {
                audioIconUse.setAttribute('href', 'assets/icons.svg#i-volume-high');
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                playBeep(440, 'sine', 0.1);
                playBeep(880, 'sine', 0.1, 0.1);
            }
        });
    }

    function playBeep(freq = 440, type = 'sine', duration = 0.1, delay = 0) {
        if (isMuted || !audioContext) return;
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + delay);

        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + delay + duration);

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        osc.start(audioContext.currentTime + delay);
        osc.stop(audioContext.currentTime + delay + duration);
    }

    // Hover sounds on links/buttons — delegated, so dynamically added
    // elements (GitHub cards) get them too; mouse-only devices only.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.addEventListener('mouseover', (e) => {
            const el = e.target.closest('a, button');
            if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) {
                playBeep(800, 'sine', 0.05);
            }
        });
    }


    // ===========================================
    // 6. Mobile Menu
    // ===========================================
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-link');

    if (hamburger && navLinks) {
        const isMenuOpen = () => navLinks.classList.contains('active');

        const openMenu = () => {
            if (isMenuOpen()) return;
            hamburger.classList.add('active');
            navLinks.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
            lockScroll();
        };

        const closeMenu = () => {
            if (!isMenuOpen()) return;
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            unlockScroll();
        };

        hamburger.addEventListener('click', () => {
            if (isMenuOpen()) closeMenu(); else openMenu();
        });

        navItems.forEach(item => item.addEventListener('click', closeMenu));

        // Escape closes the menu and returns focus to the toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen()) {
                closeMenu();
                hamburger.focus();
            }
        });

        // Widening past the breakpoint (rotation, window resize) hides the
        // hamburger — close the menu, otherwise the page stays scroll-locked
        const mobileNavQuery = window.matchMedia('(max-width: 900px)');
        mobileNavQuery.addEventListener('change', (e) => {
            if (!e.matches) closeMenu();
        });
    }


    // ===========================================
    // 7. Avatar Glitch Logic (Mobile & PC)
    // ===========================================
    const glitchContainer = document.querySelector('.profile-glitch-container');
    const realProfile = document.querySelector('.real-profile');
    const pixelProfile = document.querySelector('.pixel-profile');

    if (glitchContainer && realProfile && pixelProfile) {
        // Timing (ms)
        const AVATAR_CYCLE_MS = 12000;  // how often the auto-glitch fires
        const AVATAR_GLITCH_MS = 3000;  // how long the pixel face stays up
        const AVATAR_RESUME_MS = 5000;  // idle time after a tap before the cycle resumes

        let isPixel = false;
        let autoGlitchInterval;
        let autoRevertTimeout;
        let interactionTimeout;

        const setPixelState = (pixel) => {
            if (isPixel === pixel) return;
            isPixel = pixel;
            pixelProfile.style.animation = 'none';
            pixelProfile.offsetHeight; // trigger reflow

            if (isPixel) {
                realProfile.classList.add('active-glitch');
                pixelProfile.style.animation = 'glitch-anim-in 0.5s cubic-bezier(.25, .46, .45, .94) forwards';
            } else {
                realProfile.classList.remove('active-glitch');
                pixelProfile.style.animation = 'glitch-anim-out 0.5s cubic-bezier(.25, .46, .45, .94) forwards';
            }
        };

        const startAutoCycle = () => {
            if (prefersReducedMotion) return;
            clearInterval(autoGlitchInterval);
            autoGlitchInterval = setInterval(() => {
                if (!isPixel) {
                    setPixelState(true);
                    autoRevertTimeout = setTimeout(() => {
                        if (isPixel) setPixelState(false);
                    }, AVATAR_GLITCH_MS);
                }
            }, AVATAR_CYCLE_MS);
        };

        const suspendAutoCycle = () => {
            clearInterval(autoGlitchInterval);
            clearTimeout(autoRevertTimeout);
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                setPixelState(false);
                startAutoCycle();
            }, AVATAR_RESUME_MS);
        };

        glitchContainer.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'mouse') {
                clearInterval(autoGlitchInterval);
                clearTimeout(autoRevertTimeout);
                clearTimeout(interactionTimeout);
                setPixelState(true);
            }
        });

        glitchContainer.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'mouse') {
                setPixelState(false);
                startAutoCycle();
            }
        });

        // Click/Tap with 5x easter egg
        let tapCount = 0;
        let tapTimeout;

        glitchContainer.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimeout);
            if (tapCount >= 5) {
                activateMatrix();
                tapCount = 0;
                return;
            } else {
                tapTimeout = setTimeout(() => { tapCount = 0; }, 1000);
            }
            setPixelState(!isPixel);
            suspendAutoCycle();
        });

        startAutoCycle();
    }


    // ===========================================
    // 8. Keyboard Easter Eggs (hack + Konami)
    // ===========================================
    // "hack" shortcut
    const hackSequence = ['h', 'a', 'c', 'k'];
    let hackIndex = 0;

    // Konami code
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        // Ignore keystrokes while typing in a form field (e.g. the terminal input),
        // otherwise typing "hack" there would fire the sequence mid-word.
        if (e.target.matches('input, textarea')) return;

        // Hack sequence
        if (e.key.toLowerCase() === hackSequence[hackIndex]) {
            hackIndex++;
            if (hackIndex === hackSequence.length) {
                activateMatrix();
                hackIndex = 0;
            }
        } else {
            hackIndex = (e.key.toLowerCase() === 'h') ? 1 : 0;
        }

        // Konami code
        if (e.key === konamiCode[konamiIndex] || e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerKonami();
                konamiIndex = 0;
            }
        } else {
            // Mismatch may still start a new sequence (e.g. a third ArrowUp)
            konamiIndex = (e.key === konamiCode[0]) ? 1 : 0;
        }
    });

    // Mobile swipe Konami
    let touchStartX = 0, touchStartY = 0;
    let swipeSequence = [];
    const expectedSwipes = ['UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT'];

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        let swipeDir = '';
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
            swipeDir = diffX > 0 ? 'RIGHT' : 'LEFT';
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 30) {
            swipeDir = diffY > 0 ? 'DOWN' : 'UP';
        }

        if (swipeDir) {
            if (expectedSwipes[swipeSequence.length] === swipeDir) {
                swipeSequence.push(swipeDir);
                if (swipeSequence.length === expectedSwipes.length) {
                    triggerKonami();
                    swipeSequence = [];
                }
            } else {
                swipeSequence = [];
                if (expectedSwipes[0] === swipeDir) {
                    swipeSequence.push(swipeDir);
                }
            }
        }
    }, { passive: true });


    // ===========================================
    // 9. Scroll Progress Bar
    // ===========================================
    const scrollProgress = document.getElementById('scroll-progress');
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        // rAF batches the layout reads so scrolling stays smooth
        requestAnimationFrame(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const totalHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            const docHeight = totalHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            if (scrollProgress) {
                scrollProgress.style.width = scrollPercent + '%';
            }
            scrollTicking = false;
        });
    }, { passive: true });


    // ===========================================
    // 10. Interactive Terminal
    // ===========================================
    const terminalInput = document.getElementById('terminal-input');
    const terminalBody = document.getElementById('terminal-body');

    // (OS-specific window chrome is applied by os-chrome.js, shared with 404.html)

    if (terminalInput) {
        // Command history (ArrowUp/ArrowDown) + tab completion state
        const commandHistory = [];
        let historyIndex = 0; // points one past the newest entry when not navigating
        let historyDraft = null; // unsubmitted input remembered while navigating
        let lastListedPrefix = null; // stops repeated Tab from spamming the candidate list
        // Deliberately excludes hidden commands (hack, sudo)
        const completableCommands = ['help', 'whoami', 'skills', 'projects', 'contact', 'github', 'cv', 'theme', 'clear', 'secret'];

        // Typing sounds + editing exits history navigation (typed text becomes
        // the new baseline instead of being clobbered by a later ArrowDown)
        terminalInput.addEventListener('input', () => {
            playBeep(800 + Math.random() * 400, 'square', 0.02);
            historyIndex = commandHistory.length;
            historyDraft = null;
            lastListedPrefix = null;
        });

        function moveCaretToEnd(input) {
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }

        terminalInput.addEventListener('keydown', function(e) {
            // Enter/arrows during IME composition (CJK input) belong to the IME
            if (e.isComposing) return;

            if (e.key === 'Enter') {
                // Echo what the user actually typed; match commands case-insensitively
                const raw = this.value.trim();
                const cmd = raw.toLowerCase();
                this.value = '';

                // Like bash's ignoredups: repeating a command adds one history entry
                if (raw !== '' && commandHistory[commandHistory.length - 1] !== raw) {
                    commandHistory.push(raw);
                }
                historyIndex = commandHistory.length;
                historyDraft = null;

                echoCommand(raw);
                processCommand(cmd, raw);
                terminalBody.scrollTop = terminalBody.scrollHeight;
                playBeep(300, 'square', 0.1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (commandHistory.length === 0 || historyIndex === 0) return;
                if (historyDraft === null) {
                    historyDraft = this.value;
                }
                historyIndex--;
                this.value = commandHistory[historyIndex];
                moveCaretToEnd(this);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex >= commandHistory.length) return;
                historyIndex++;
                if (historyIndex === commandHistory.length) {
                    // Walked past the newest entry — restore the draft
                    this.value = historyDraft !== null ? historyDraft : '';
                    historyDraft = null;
                } else {
                    this.value = commandHistory[historyIndex];
                }
                moveCaretToEnd(this);
            } else if (e.key === 'Tab' && !e.shiftKey) {
                const current = this.value.trim().toLowerCase();
                const matches = completableCommands.filter(c => c.startsWith(current));
                // Nothing to complete — let Tab do its normal job so keyboard
                // users can move focus past the terminal (no keyboard trap)
                if (current === '' || matches.length === 0) return;
                e.preventDefault();

                if (matches.length === 1) {
                    this.value = matches[0];
                    moveCaretToEnd(this);
                } else {
                    // Complete to the longest common prefix
                    let prefix = matches[0];
                    for (const m of matches.slice(1)) {
                        while (!m.startsWith(prefix)) {
                            prefix = prefix.slice(0, -1);
                        }
                    }
                    this.value = prefix;
                    moveCaretToEnd(this);
                    // List candidates only when completion stalls, once per prefix
                    if (prefix === current && lastListedPrefix !== current) {
                        lastListedPrefix = current;
                        printTerminalText(matches.join('  '));
                        terminalBody.scrollTop = terminalBody.scrollHeight;
                    }
                }
            }
        });

        function insertTerminalLine(div) {
            const inputLine = document.querySelector('.terminal-input-line');
            if (inputLine) {
                terminalBody.insertBefore(div, inputLine);
            } else {
                terminalBody.appendChild(div);
            }
        }

        // For trusted, hardcoded HTML only — never user input
        function printTerminalLine(html) {
            const div = document.createElement('div');
            div.className = 'terminal-line';
            div.innerHTML = html;
            insertTerminalLine(div);
        }

        // Echoes user input safely as plain text (no innerHTML)
        function echoCommand(cmd) {
            const div = document.createElement('div');
            div.className = 'terminal-line';
            const prompt = document.createElement('span');
            prompt.className = 'prompt';
            prompt.textContent = 'contihan@mainframe:~$';
            div.appendChild(prompt);
            div.appendChild(document.createTextNode(' ' + cmd));
            insertTerminalLine(div);
        }

        // Plain-text output for strings that may contain user input
        function printTerminalText(text) {
            const div = document.createElement('div');
            div.className = 'terminal-line';
            div.textContent = text;
            insertTerminalLine(div);
        }

        function processCommand(cmd, raw = cmd) {
            // The switch matches exact strings; sudo takes arguments, so catch it first
            if (cmd === 'sudo' || cmd.startsWith('sudo ')) {
                printTerminalText('Permission denied: nice try. This incident will be reported.');
                return;
            }

            switch(cmd) {
                case 'help':
                    printTerminalLine('Available commands: <br> - <span class="highlight-cmd">whoami</span>: Display user info<br> - <span class="highlight-cmd">skills</span>: List technical stack<br> - <span class="highlight-cmd">projects</span>: Jump to projects<br> - <span class="highlight-cmd">contact</span>: Open comm channels<br> - <span class="highlight-cmd">github</span>: Access repository index<br> - <span class="highlight-cmd">cv</span>: Transmit résumé<br> - <span class="highlight-cmd">theme</span>: Recalibrate photon emitters<br> - <span class="highlight-cmd">clear</span>: Clear terminal<br> - <span class="highlight-cmd">secret</span>: 🤫');
                    break;
                case 'whoami':
                    printTerminalLine('404: Human not found. Running Daniel.exe...<br>I am Daniel Hanák, a QA, Performance, and Security Engineer obsessed with Data Science and AI models.');
                    break;
                case 'skills':
                    printTerminalLine('Loading skill matrix...<br>[OK] C# — NUnit + proprietary API test framework<br>[OK] k6 performance testing (JavaScript)<br>[OK] Security — dep/vuln scans, pentest SPOC, CVE/CVSS/NIST/ASVS/NIS2<br>[OK] Python — statistics, data science, AI models<br>[OK] Azure DevOps pipelines, Pulumi');
                    break;
                case 'projects':
                    printTerminalLine('Redirecting to sector 03...');
                    setTimeout(() => document.getElementById('projects').scrollIntoView({behavior: 'smooth'}), 500);
                    break;
                case 'contact':
                    printTerminalLine('Opening comm channels...<br>► Email: <a href="mailto:daniel.hanak@outlook.cz" class="highlight-cmd">daniel.hanak@outlook.cz</a><br>► GitHub: <a href="https://github.com/ContiHan" target="_blank" rel="noopener noreferrer" class="highlight-cmd">github.com/ContiHan</a><br>► LinkedIn: <a href="https://www.linkedin.com/in/daniel-han%C3%A1k-b3405864/" target="_blank" rel="noopener noreferrer" class="highlight-cmd">linkedin.com/in/daniel-hanák</a>');
                    break;
                case 'github':
                    printTerminalLine('Opening repository index...<br><a href="https://github.com/ContiHan?tab=repositories" target="_blank" rel="noopener noreferrer" class="highlight-cmd">github.com/ContiHan?tab=repositories</a>');
                    break;
                case 'cv':
                    printTerminalLine('Transmitting résumé...<br><a href="assets/cv_daniel_hanak.pdf" target="_blank" rel="noopener noreferrer" class="highlight-cmd">cv_daniel_hanak.pdf</a>');
                    break;
                case 'theme':
                    document.getElementById('theme-toggle').click();
                    printTerminalLine('Recalibrating photon emitters... display polarity inverted.');
                    break;
                case 'secret':
                    printTerminalLine('🔓 <span class="highlight-cmd">Hidden protocols detected:</span><br><br>► Type <span class="highlight-cmd">hack</span> to initiate the Matrix protocol<br>► Enter the <span class="highlight-cmd">Konami Code</span> (↑↑↓↓←→←→BA — or swipe ↑↑↓↓←→←→ on mobile) for a system glitch<br>► Tap the avatar <span class="highlight-cmd">5×</span> rapidly for a surprise');
                    break;
                case 'hack':
                    printTerminalLine('Initializing Matrix protocol...');
                    setTimeout(activateMatrix, 1000);
                    break;
                case 'clear': {
                    const lines = terminalBody.querySelectorAll('.terminal-line:not(.terminal-input-line)');
                    lines.forEach(l => l.remove());
                    break;
                }
                case '':
                    break;
                default:
                    printTerminalText(`Command not found: ${raw}. Type 'help' for available commands.`);
            }
        }

        // Click terminal to focus input — but not when the click ended a text
        // selection (focusing the input would wipe it, e.g. copying the email)
        const termWin = document.querySelector('.terminal-window');
        if (termWin) {
            termWin.addEventListener('click', () => {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) return;
                terminalInput.focus();
            });
        }
    }


    // ===========================================
    // 11. 3D Tilt Effect for Desktop
    // ===========================================
    // Skipped entirely under prefers-reduced-motion (the CSS hover lift stays)
    const cards = prefersReducedMotion ? [] : document.querySelectorAll('.project-card');

    cards.forEach(card => {
        let rect = null;

        card.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse') return;
            // Cache the untransformed box once per hover instead of forcing
            // layout on every pointermove
            rect = card.getBoundingClientRect();
        });

        // Wheel-scrolling while hovering moves the card — the cached box goes stale
        window.addEventListener('scroll', () => {
            if (rect) rect = card.getBoundingClientRect();
        }, { passive: true });

        card.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' || !rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('pointerleave', () => {
            rect = null;
            // Clear rather than reset: a leftover inline transform would
            // permanently override the CSS :hover lift on later hovers
            card.style.transform = '';
        });
    });


    // ===========================================
    // 12. Fetch GitHub Repos
    // ===========================================
    const renderGithubRepos = (repos, reposContainer) => {
        reposContainer.innerHTML = '';

        repos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'github-card';

            // API data is built as DOM nodes with textContent (no innerHTML)
            const heading = document.createElement('h4');
            const link = document.createElement('a');
            // Defense in depth: only ever link to github.com (blocks javascript: URLs
            // from a tampered response or a poisoned sessionStorage cache)
            link.href = /^https:\/\/github\.com\//.test(repo.html_url)
                ? repo.html_url
                : 'https://github.com/ContiHan?tab=repositories';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = repo.name;
            heading.appendChild(link);

            const desc = document.createElement('p');
            desc.textContent = repo.description || '[UNKNOWN]';

            const stats = document.createElement('div');
            stats.className = 'github-stats';

            const addStat = (iconName, text) => {
                const span = document.createElement('span');
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('class', 'icon');
                svg.setAttribute('aria-hidden', 'true');
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttribute('href', 'assets/icons.svg#i-' + iconName);
                svg.appendChild(use);
                span.appendChild(svg);
                span.appendChild(document.createTextNode(' ' + text));
                stats.appendChild(span);
            };

            const updatedDate = new Date(repo.pushed_at || repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const sizeInKb = repo.size;
            const sizeText = sizeInKb > 1024 ? (sizeInKb / 1024).toFixed(1) + ' MB' : sizeInKb + ' KB';

            addStat('clock', updatedDate);
            addStat('hard-drive', sizeText);
            if (repo.language) addStat('code', repo.language);
            if (repo.stargazers_count > 0) addStat('star', repo.stargazers_count);
            if (repo.forks_count > 0) addStat('code-branch', repo.forks_count);

            card.appendChild(heading);
            card.appendChild(desc);
            card.appendChild(stats);
            reposContainer.appendChild(card);
        });
    };

    const fetchGithubRepos = async () => {
        const reposContainer = document.getElementById('github-repos');
        if (!reposContainer) return;

        const CACHE_KEY = 'github-repos-cache';
        const CACHE_TTL = 60 * 60 * 1000; // 1 hour — softens the 60 req/h unauthenticated limit

        try {
            const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
            if (cached && Array.isArray(cached.repos) && Date.now() - cached.time < CACHE_TTL) {
                renderGithubRepos(cached.repos, reposContainer);
                reposContainer.setAttribute('aria-busy', 'false');
                return;
            }
        } catch (e) { /* bad/absent cache — fetch fresh */ }

        try {
            const response = await fetch('https://api.github.com/users/ContiHan/repos?sort=updated&per_page=3');
            if (!response.ok) throw new Error('Network response was not ok');
            const repos = await response.json();
            // Error payloads (rate limit etc.) can arrive as objects — never cache them
            if (!Array.isArray(repos)) throw new Error('Unexpected GitHub API payload');

            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), repos }));
            } catch (e) { /* storage unavailable */ }

            renderGithubRepos(repos, reposContainer);
            reposContainer.setAttribute('aria-busy', 'false');
        } catch (error) {
            console.error('Error fetching repos:', error);
            reposContainer.innerHTML = '';
            const fallback = document.createElement('p');
            fallback.appendChild(document.createTextNode('Failed to load GitHub transmissions. '));
            const profileLink = document.createElement('a');
            profileLink.href = 'https://github.com/ContiHan?tab=repositories';
            profileLink.target = '_blank';
            profileLink.rel = 'noopener noreferrer';
            profileLink.textContent = 'Browse repositories on GitHub →';
            fallback.appendChild(profileLink);
            reposContainer.appendChild(fallback);
            reposContainer.setAttribute('aria-busy', 'false');
        }
    };

    fetchGithubRepos();


    // ===========================================
    // 13. Update Footer Year
    // ===========================================
    document.getElementById('year').textContent = new Date().getFullYear();


    // ===========================================
    // 14. Matrix Easter Egg (unified)
    // ===========================================
    // Timing (ms)
    const MATRIX_INTRO_MS = 1000;  // green fade-in before the rain starts
    const MATRIX_RAIN_MS = 5000;   // how long new drops keep spawning
    const MATRIX_FRAME_MS = 33;    // ~30 fps
    const MATRIX_FADE_MS = 1000;   // canvas fade-out before cleanup
    const MATRIX_STATIC_MS = 2500; // reduced motion: how long the static green mode lasts

    function activateMatrix() {
        // Prevent double-trigger
        if (document.getElementById('matrix-overlay')) return;

        playBeep(300, 'square', 1.0);
        lockScroll();

        // Phase 1: Smooth transition to green
        document.body.classList.add('matrix-mode-active');

        const overlay = document.createElement('div');
        overlay.id = 'matrix-overlay';

        // Reduced motion: keep the green "Matrix mode" but skip the falling rain.
        // The empty overlay still acts as the double-trigger guard.
        if (prefersReducedMotion) {
            overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
            document.body.appendChild(overlay);
            const endStatic = () => {
                clearTimeout(staticTimer);
                document.removeEventListener('keydown', escStatic);
                overlay.remove();
                document.body.classList.remove('matrix-mode-active');
                unlockScroll();
            };
            const escStatic = (e) => {
                if (e.key === 'Escape') endStatic();
            };
            document.addEventListener('keydown', escStatic);
            const staticTimer = setTimeout(endStatic, MATRIX_STATIC_MS);
            return;
        }

        // Create overlay with canvas (hidden at first)
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;pointer-events:none;opacity:0;transition:opacity 0.5s ease;';

        // Device-pixel-ratio-aware canvas — crisp rain on retina/mobile screens
        const dpr = window.devicePixelRatio || 1;
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const canvas = document.createElement('canvas');
        canvas.width = viewW * dpr;
        canvas.height = viewH * dpr;
        canvas.style.cssText = 'display:block;width:100%;height:100%;';
        overlay.appendChild(canvas);
        document.body.appendChild(overlay);

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"#&_(),.;:?!\\|{}<>[]^~'.split('');
        const fontSize = 16;
        const columns = Math.floor(viewW / fontSize);
        const drops = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;

        let stopping = false;

        // Escape cancels the effect early (rain drains out, then cleans up)
        const escHandler = (e) => {
            if (e.key === 'Escape') stopping = true;
        };
        document.addEventListener('keydown', escHandler);

        // Phase 2: Start rain after green transition settles (1s delay)
        setTimeout(() => {
            overlay.style.opacity = '1';

            let lastFrame = 0;
            let rafId;

            const drawFrame = (timestamp) => {
                if (timestamp - lastFrame < MATRIX_FRAME_MS) {
                    rafId = requestAnimationFrame(drawFrame);
                    return;
                }
                lastFrame = timestamp;

                ctx.fillStyle = 'rgba(0, 17, 0, 0.15)';
                ctx.fillRect(0, 0, viewW, viewH);

                ctx.fillStyle = '#0F0';
                ctx.font = fontSize + 'px monospace';

                let allDropped = true;
                for (let i = 0; i < drops.length; i++) {
                    if (drops[i] !== -1) {
                        allDropped = false;
                        const text = chars[Math.floor(Math.random() * chars.length)];
                        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                        if (stopping) {
                            if (drops[i] * fontSize > viewH) {
                                drops[i] = -1;
                            } else {
                                drops[i]++;
                            }
                        } else {
                            if (drops[i] * fontSize > viewH && Math.random() > 0.975) {
                                drops[i] = 0;
                            }
                            drops[i]++;
                        }
                    }
                }

                // Phase 3: All rain finished — smooth transition back
                if (stopping && allDropped) {
                    cancelAnimationFrame(rafId);
                    document.removeEventListener('keydown', escHandler);
                    overlay.style.opacity = '0';
                    // Wait for canvas fade, then remove green
                    setTimeout(() => {
                        overlay.remove();
                        document.body.classList.remove('matrix-mode-active');
                        unlockScroll();
                    }, MATRIX_FADE_MS);
                    return;
                }

                rafId = requestAnimationFrame(drawFrame);
            };

            rafId = requestAnimationFrame(drawFrame);

            // Stop generating new drops after the rain window
            setTimeout(() => {
                stopping = true;
            }, MATRIX_RAIN_MS);
        }, MATRIX_INTRO_MS);
    }


    // ===========================================
    // 15. Konami Code Glitch Effect
    // ===========================================
    // Timing (ms) and layout of the pixelation effect
    const KONAMI_BLOCKS = 5;          // horizontal stripes covering the viewport
    const KONAMI_BLOCK_IN_MS = 200;   // cascade-in step per block (also paces the crash sounds)
    const KONAMI_BLOCK_OUT_MS = 150;  // cascade-out step per block
    const KONAMI_HOLD_MS = 1000;      // full-glitch hold before the blocks retreat

    function triggerKonami() {
        // Prevent double-trigger (mirrors activateMatrix)
        if (document.getElementById('konami-overlay')) return;

        lockScroll();

        // 8-bit crash sounds
        let pitch = 150;
        for (let i = 0; i < KONAMI_BLOCKS; i++) {
            setTimeout(() => {
                playBeep(pitch, 'sawtooth', 0.2);
                pitch -= 20;
            }, i * KONAMI_BLOCK_IN_MS);
        }

        const crashOverlay = document.createElement('div');
        crashOverlay.id = 'konami-overlay';
        crashOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;pointer-events:none;';
        document.body.appendChild(crashOverlay);

        const blockHeight = 100 / KONAMI_BLOCKS;
        const blockEls = [];
        // Reduced motion: no cascading stripes — the screen covers and clears
        // in one step (the sounds keep their own pacing above/below)
        const blockInStep = prefersReducedMotion ? 0 : KONAMI_BLOCK_IN_MS;
        const blockOutStep = prefersReducedMotion ? 0 : KONAMI_BLOCK_OUT_MS;

        // Pixelate down — blocks slide in from top
        for (let i = 0; i < KONAMI_BLOCKS; i++) {
            setTimeout(() => {
                const block = document.createElement('div');
                block.style.position = 'absolute';
                block.style.top = (i * blockHeight) + 'vh';
                block.style.left = '0';
                block.style.width = '100vw';
                block.style.height = blockHeight + 'vh';
                block.style.backgroundColor = (i % 2 === 0) ? '#000' : '#111';
                block.style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,255,0,0.1) 10px, rgba(0,255,0,0.1) 20px)';
                crashOverlay.appendChild(block);
                blockEls.push(block);
            }, i * blockInStep);
            setTimeout(() => playBeep(100 + i * 40, 'square', 0.08), i * KONAMI_BLOCK_IN_MS);
        }

        // Pixelate up — blocks removed from bottom
        setTimeout(() => {
            let pitchUp = 50;
            for (let i = 0; i < KONAMI_BLOCKS; i++) {
                setTimeout(() => {
                    playBeep(pitchUp, 'square', 0.1);
                    pitchUp += 30;
                }, i * KONAMI_BLOCK_OUT_MS);
                setTimeout(() => {
                    if (blockEls.length > 0) {
                        const b = blockEls.pop();
                        b.remove();
                    }
                }, i * blockOutStep);
            }

            // Cleanup
            setTimeout(() => {
                crashOverlay.remove();
                unlockScroll();
            }, KONAMI_BLOCKS * KONAMI_BLOCK_OUT_MS + 100);

        }, KONAMI_BLOCKS * KONAMI_BLOCK_IN_MS + KONAMI_HOLD_MS);
    }

});
