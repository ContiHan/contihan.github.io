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
    // 1. Typewriter Effect
    // ===========================================
    const typewriterElement = document.getElementById('typewriter');
    const texts = [
        "Running statistical analysis...",
        "Searching for security vulnerabilities...",
        "Executing performance tests...",
        "May the Force be with you."
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typeWriter() {
        const currentText = texts[textIndex];

        if (isDeleting) {
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = Math.floor(Math.random() * 70) + 30;
            if (Math.random() < 0.1) {
                typingSpeed += Math.floor(Math.random() * 250) + 100;
            }
        }

        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }

        setTimeout(typeWriter, typingSpeed);
    }

    if (prefersReducedMotion) {
        typewriterElement.textContent = texts[0];
    } else {
        setTimeout(typeWriter, 1000);
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

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ===========================================
    // 3. Theme Toggle
    // ===========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    const sunSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    function updateIcon(theme) {
        if (theme === 'light') {
            themeToggleBtn.innerHTML = moonSVG;
        } else {
            themeToggleBtn.innerHTML = sunSVG;
        }
    }

    // Theme attribute is already set pre-paint by the inline script in <head>;
    // here we only sync the icon with it.
    updateIcon(htmlElement.getAttribute('data-theme') || 'dark');

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
                const bar = entry.target;
                bar.style.width = bar.getAttribute('data-width');
                observer.unobserve(bar);
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
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            const isOpen = navLinks.classList.contains('active');
            hamburger.setAttribute('aria-expanded', String(isOpen));
            // Restore to '' (not 'auto') so the stylesheet's overflow-x: hidden survives
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }


    // ===========================================
    // 7. Avatar Glitch Logic (Mobile & PC)
    // ===========================================
    const glitchContainer = document.querySelector('.profile-glitch-container');
    const realProfile = document.querySelector('.real-profile');
    const pixelProfile = document.querySelector('.pixel-profile');

    if (glitchContainer && realProfile && pixelProfile) {
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
                    }, 3000);
                }
            }, 12000);
        };

        const suspendAutoCycle = () => {
            clearInterval(autoGlitchInterval);
            clearTimeout(autoRevertTimeout);
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                setPixelState(false);
                startAutoCycle();
            }, 5000);
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
            if (e.key === 'Enter') {
                const cmd = this.value.trim().toLowerCase();
                this.value = '';

                if (cmd !== '') {
                    commandHistory.push(cmd);
                }
                historyIndex = commandHistory.length;
                historyDraft = null;

                echoCommand(cmd);
                processCommand(cmd);
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

        function processCommand(cmd) {
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
                    printTerminalText(`Command not found: ${cmd}. Type 'help' for available commands.`);
            }
        }

        // Click terminal to focus input
        const termWin = document.querySelector('.terminal-window');
        if (termWin) {
            termWin.addEventListener('click', () => {
                terminalInput.focus();
            });
        }
    }


    // ===========================================
    // 11. 3D Tilt Effect for Desktop
    // ===========================================
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        let rect = null;

        card.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse') return;
            // Cache the untransformed box once per hover instead of forcing
            // layout on every pointermove
            rect = card.getBoundingClientRect();
        });

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

        card.addEventListener('mouseleave', () => {
            rect = null;
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
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
            link.href = repo.html_url;
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
            if (cached && Date.now() - cached.time < CACHE_TTL) {
                renderGithubRepos(cached.repos, reposContainer);
                return;
            }
        } catch (e) { /* bad/absent cache — fetch fresh */ }

        try {
            const response = await fetch('https://api.github.com/users/ContiHan/repos?sort=updated&per_page=3');
            if (!response.ok) throw new Error('Network response was not ok');
            const repos = await response.json();

            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), repos }));
            } catch (e) { /* storage unavailable */ }

            renderGithubRepos(repos, reposContainer);
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
    function activateMatrix() {
        // Prevent double-trigger
        if (document.getElementById('matrix-overlay')) return;

        playBeep(300, 'square', 1.0);
        document.body.style.overflow = 'hidden';

        // Phase 1: Smooth transition to green (1s)
        document.body.classList.add('matrix-mode-active');

        // Create overlay with canvas (hidden at first)
        const overlay = document.createElement('div');
        overlay.id = 'matrix-overlay';
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
                if (timestamp - lastFrame < 33) { // ~30 fps
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
                        document.body.style.overflow = '';
                    }, 1000);
                    return;
                }

                rafId = requestAnimationFrame(drawFrame);
            };

            rafId = requestAnimationFrame(drawFrame);

            // Stop generating new drops after 5 seconds
            setTimeout(() => {
                stopping = true;
            }, 5000);
        }, 1000);
    }


    // ===========================================
    // 15. Konami Code Glitch Effect
    // ===========================================
    function triggerKonami() {
        // Prevent double-trigger (mirrors activateMatrix)
        if (document.getElementById('konami-overlay')) return;

        document.body.style.overflow = 'hidden';

        // 8-bit crash sounds
        let pitch = 150;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                playBeep(pitch, 'sawtooth', 0.2);
                pitch -= 20;
            }, i * 200);
        }

        const crashOverlay = document.createElement('div');
        crashOverlay.id = 'konami-overlay';
        crashOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;pointer-events:none;';
        document.body.appendChild(crashOverlay);

        const blocks = 5;
        const blockHeight = 100 / blocks;
        const blockEls = [];

        // Pixelate down — blocks slide in from top
        for (let i = 0; i < blocks; i++) {
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
                playBeep(100 + i * 40, 'square', 0.08);
            }, i * 200);
        }

        // Pixelate up — blocks removed from bottom
        setTimeout(() => {
            let pitchUp = 50;
            for (let i = 0; i < blocks; i++) {
                setTimeout(() => {
                    playBeep(pitchUp, 'square', 0.1);
                    pitchUp += 30;
                    if (blockEls.length > 0) {
                        const b = blockEls.pop();
                        b.remove();
                    }
                }, i * 150);
            }

            // Cleanup
            setTimeout(() => {
                crashOverlay.remove();
                document.body.style.overflow = '';
            }, blocks * 150 + 100);

        }, blocks * 200 + 1000);
    }

});
