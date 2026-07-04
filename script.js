/* ===========================================
   Prevent scroll restoration on refresh
=========================================== */
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // 1. Typewriter Effect
    // ===========================================
    const typewriterElement = document.getElementById('typewriter');
    const texts = [
        "Analyzing data via statistics...",
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

    setTimeout(typeWriter, 1000);


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

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        updateIcon('light');
    } else {
        updateIcon('dark');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);

        // Quick glitch effect on theme switch
        document.body.classList.add('konami-active');
        setTimeout(() => {
            document.body.classList.remove('konami-active');
        }, 500);

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
        if (!audioContext) {
            audioContext = new AudioContextClass();
        }
        playBeep(20000, 'sine', 0.001); // inaudible warmup
    };
    document.addEventListener('pointerdown', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    const audioToggleBtn = document.getElementById('audio-toggle');
    const audioIcon = audioToggleBtn.querySelector('i');

    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new AudioContextClass();
            }

            isMuted = !isMuted;
            if (isMuted) {
                audioIcon.classList.remove('fa-volume-up');
                audioIcon.classList.add('fa-volume-mute');
            } else {
                audioIcon.classList.remove('fa-volume-mute');
                audioIcon.classList.add('fa-volume-up');
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

    // Hover sounds on links/buttons
    document.querySelectorAll('a, button, .btn').forEach(el => {
        el.addEventListener('mouseenter', () => playBeep(800, 'sine', 0.05));
    });


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
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'auto';
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = 'auto';
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
            clearInterval(autoGlitchInterval);
            autoGlitchInterval = setInterval(() => {
                if (!isPixel) {
                    setPixelState(true);
                    setTimeout(() => {
                        if (isPixel) setPixelState(false);
                    }, 3000);
                }
            }, 12000);
        };

        const suspendAutoCycle = () => {
            clearInterval(autoGlitchInterval);
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                setPixelState(false);
                startAutoCycle();
            }, 5000);
        };

        glitchContainer.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'mouse') {
                clearInterval(autoGlitchInterval);
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
            konamiIndex = 0;
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
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const bodyScroll = document.body.scrollHeight || 0;
        const docScroll = document.documentElement.scrollHeight || 0;
        const totalHeight = Math.max(bodyScroll, docScroll);
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const docHeight = totalHeight - windowHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (scrollProgress) {
            scrollProgress.style.width = scrollPercent + '%';
        }
    });


    // ===========================================
    // 10. Interactive Terminal
    // ===========================================
    const terminalInput = document.getElementById('terminal-input');
    const terminalBody = document.getElementById('terminal-body');

    if (terminalInput) {
        // Typing sounds
        terminalInput.addEventListener('input', () => {
            playBeep(800 + Math.random() * 400, 'square', 0.02);
        });

        terminalInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const cmd = this.value.trim().toLowerCase();
                this.value = '';

                printTerminalLine(`<span class="prompt">contihan@mainframe:~$</span> ${cmd}`);
                processCommand(cmd);
                terminalBody.scrollTop = terminalBody.scrollHeight;
                playBeep(300, 'square', 0.1);
            }
        });

        function printTerminalLine(html) {
            const div = document.createElement('div');
            div.className = 'terminal-line';
            div.innerHTML = html;
            const inputLine = document.querySelector('.terminal-input-line');
            if (inputLine) {
                terminalBody.insertBefore(div, inputLine);
            } else {
                terminalBody.appendChild(div);
            }
        }

        function processCommand(cmd) {
            switch(cmd) {
                case 'help':
                    printTerminalLine('Available commands: <br> - <span class="highlight-cmd">whoami</span>: Display user info<br> - <span class="highlight-cmd">skills</span>: List technical stack<br> - <span class="highlight-cmd">clear</span>: Clear terminal<br> - <span class="highlight-cmd">projects</span>: Jump to projects<br> - <span class="highlight-cmd">hack</span>: ???<br> - <span class="highlight-cmd">matrix</span>: ???');
                    break;
                case 'whoami':
                    printTerminalLine('404: Human not found. Running Daniel.exe...<br>I am Daniel Hanák, a QA, Performance, and Security Engineer obsessed with Data Science and AI models.');
                    break;
                case 'skills':
                    printTerminalLine('Loading skill matrix...<br>[OK] Python, Java, C#<br>[OK] Cypress, Playwright, Selenium<br>[OK] JMeter, K6, Gatling<br>[OK] SQL, NoSQL, APIs');
                    break;
                case 'projects':
                    printTerminalLine('Redirecting to sector 03...');
                    setTimeout(() => document.getElementById('projects').scrollIntoView({behavior: 'smooth'}), 500);
                    break;
                case 'hack':
                case 'matrix':
                    printTerminalLine('Initializing Matrix protocol...');
                    setTimeout(activateMatrix, 1000);
                    break;
                case 'clear':
                    const lines = terminalBody.querySelectorAll('.terminal-line:not(.terminal-input-line)');
                    lines.forEach(l => l.remove());
                    break;
                case '':
                    break;
                default:
                    printTerminalLine(`Command not found: ${cmd}. Type 'help' for available commands.`);
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
        card.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });


    // ===========================================
    // 12. Fetch GitHub Repos
    // ===========================================
    const fetchGithubRepos = async () => {
        const reposContainer = document.getElementById('github-repos');
        if (!reposContainer) return;

        try {
            const response = await fetch('https://api.github.com/users/ContiHan/repos?sort=updated&per_page=3');
            if (!response.ok) throw new Error('Network response was not ok');
            const repos = await response.json();

            reposContainer.innerHTML = '';

            repos.forEach(repo => {
                const card = document.createElement('div');
                card.className = 'github-card';

                const updatedDate = new Date(repo.pushed_at || repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const desc = repo.description || '[UNKNOWN]';

                const sizeInKb = repo.size;
                const sizeText = sizeInKb > 1024 ? (sizeInKb / 1024).toFixed(1) + ' MB' : sizeInKb + ' KB';

                let statsHtml = `<span><i class="fas fa-clock"></i> ${updatedDate}</span>`;
                statsHtml += `<span><i class="fas fa-hdd"></i> ${sizeText}</span>`;
                if (repo.language) statsHtml += `<span><i class="fas fa-code"></i> ${repo.language}</span>`;
                if (repo.stargazers_count > 0) statsHtml += `<span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>`;
                if (repo.forks_count > 0) statsHtml += `<span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>`;

                card.innerHTML = `
                    <h4><a href="${repo.html_url}" target="_blank">${repo.name}</a></h4>
                    <p>${desc}</p>
                    <div class="github-stats">
                        ${statsHtml}
                    </div>
                `;
                reposContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching repos:', error);
            reposContainer.innerHTML = '<p>Failed to load GitHub transmissions.</p>';
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

        // Apply green theme to the whole page
        document.body.classList.add('matrix-mode-active');
        document.body.style.overflow = 'hidden';

        // Create overlay with canvas
        const overlay = document.createElement('div');
        overlay.id = 'matrix-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;pointer-events:none;';

        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = 'block';
        overlay.appendChild(canvas);
        document.body.appendChild(overlay);

        const ctx = canvas.getContext('2d');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"#&_(),.;:?!\\|{}<>[]^~'.split('');
        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;

        let stopping = false;

        const matrixInterval = setInterval(() => {
            // Fade old characters by drawing semi-transparent black
            ctx.fillStyle = 'rgba(0, 17, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            let allDropped = true;
            for (let i = 0; i < drops.length; i++) {
                if (drops[i] !== -1) {
                    allDropped = false;
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (stopping) {
                        // Let each column finish falling off screen
                        if (drops[i] * fontSize > canvas.height) {
                            drops[i] = -1; // done
                        } else {
                            drops[i]++;
                        }
                    } else {
                        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                            drops[i] = 0;
                        }
                        drops[i]++;
                    }
                }
            }

            // All columns finished — clean up
            if (stopping && allDropped) {
                clearInterval(matrixInterval);
                overlay.remove();
                document.body.classList.remove('matrix-mode-active');
                document.body.style.overflow = '';
            }
        }, 33);

        // Stop generating new drops after 5 seconds
        setTimeout(() => {
            stopping = true;
        }, 5000);
    }


    // ===========================================
    // 15. Konami Code Glitch Effect
    // ===========================================
    function triggerKonami() {
        // Brief glitch burst (500ms), then stop shaking
        document.body.classList.add('konami-active');
        setTimeout(() => {
            document.body.classList.remove('konami-active');
        }, 500);

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
