document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Typewriter Effect ---
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
            typingSpeed = 50; // Faster delete
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            // Random delay 30-100ms
            typingSpeed = Math.floor(Math.random() * 70) + 30;
            // 10% chance to pause longer (simulate human hesitation or harder keypress)
            if (Math.random() < 0.1) {
                typingSpeed += Math.floor(Math.random() * 250) + 100;
            }
        }

        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500; // Pause before next word
        }

        setTimeout(typeWriter, typingSpeed);
    }
    
    // Start typewriter slightly after load
    setTimeout(typeWriter, 1000);


    // --- 2. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.section-reveal');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    };

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });


    // --- 3. Theme Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const icon = themeToggleBtn.querySelector('i');

    // Check local storage for preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateIcon(newTheme);
        
        // Extreme Matrix glitch effect on theme switch
        document.body.classList.add('konami-active');
        setTimeout(() => {
            document.body.classList.remove('konami-active');
        }, 500);
    });

    function updateIcon(theme) {
        if (theme === 'light') {
            icon.classList.remove('fa-adjust');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-adjust');
        }
    }

    // --- 4. Skills Progress Animation ---
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

    // --- 5. Easter Egg (Hack / Konami Code) ---
    let hackSequence = ['h', 'a', 'c', 'k'];
    let hackIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === hackSequence[hackIndex]) {
            hackIndex++;
            if (hackIndex === hackSequence.length) {
                activateMatrix();
                hackIndex = 0;
            }
        } else {
            hackIndex = (e.key.toLowerCase() === 'h') ? 1 : 0;
        }
    });

    // --- 6. Avatar Glitch Logic (Mobile & PC Unified) ---
    const glitchContainer = document.querySelector('.profile-glitch-container');
    const realProfile = document.querySelector('.real-profile');
    const pixelProfile = document.querySelector('.pixel-profile');
    
    if (glitchContainer && realProfile && pixelProfile) {
        let isPixel = false;
        let autoGlitchInterval;
        let interactionTimeout;

        // Core state toggler
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

        // Auto Cycle Logic
        const startAutoCycle = () => {
            clearInterval(autoGlitchInterval);
            autoGlitchInterval = setInterval(() => {
                if (!isPixel) {
                    setPixelState(true);
                    setTimeout(() => {
                        if (isPixel) setPixelState(false);
                    }, 3000); // Hold pixel art for 3 seconds
                }
            }, 12000);
        };

        // Suspend Auto Cycle after manual interaction
        const suspendAutoCycle = () => {
            clearInterval(autoGlitchInterval);
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                setPixelState(false);
                startAutoCycle();
            }, 5000); // 5 seconds of inactivity -> revert to normal and restart cycle
        };

        // Mouse Hover Events (PC only - skips touch)
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

        // Click / Tap Events (Mobile & PC manual toggling)
        let tapCount = 0;
        let tapTimeout;
        
        glitchContainer.addEventListener('click', () => {
            // Easter egg logic
            tapCount++;
            clearTimeout(tapTimeout);
            if (tapCount >= 5) {
                activateMatrix();
                tapCount = 0;
                return;
            } else {
                tapTimeout = setTimeout(() => { tapCount = 0; }, 1000);
            }

            // Toggle state manually
            setPixelState(!isPixel);
            suspendAutoCycle();
        });

        // Start cycle initially
        startAutoCycle();
    }

    function activateMatrix() {
        if (document.getElementById('matrix-canvas')) return;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '9999';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.8';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=<>?';
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#0f0';
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random() * letters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        const interval = setInterval(draw, 33);
        
        setTimeout(() => {
            clearInterval(interval);
            canvas.style.transition = 'opacity 2s';
            canvas.style.opacity = '0';
            setTimeout(() => canvas.remove(), 2000);
        }, 8000);
    }

    // --- 6. Update Footer Year ---
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- 5. Mobile Menu ---
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

    // --- 6. Fetch GitHub Repos ---
    const fetchGithubRepos = async () => {
        const reposContainer = document.getElementById('github-repos');
        if (!reposContainer) return;

        try {
            const response = await fetch('https://api.github.com/users/ContiHan/repos?sort=updated&per_page=3');
            if (!response.ok) throw new Error('Network response was not ok');
            const repos = await response.json();
            
            reposContainer.innerHTML = ''; // clear loader
            
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

});

document.addEventListener('DOMContentLoaded', () => {

    // --- 7. Audio System ---
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;
    
    // Pre-warm audio context on first arbitrary user interaction
    const initAudio = () => {
        if (!audioContext) {
            audioContext = new AudioContextClass();
        }
        
            // Play an inaudible, microscopic beep to force the engine to start processing
            playBeep(20000, 'sine', 0.001);
            document.removeEventListener('pointerdown', initAudio);
        document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('pointerdown', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    let isMuted = true; // start muted to comply with browser autoplay policies
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
                // Resume context if suspended (required by browsers)
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                // Play a startup sound
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
        if (isMuted || !audioContext) return;
        
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + delay);
        
        // fade out slightly to prevent clicks
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + delay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        osc.start(audioContext.currentTime + delay);
        osc.stop(audioContext.currentTime + delay + duration);
    }

    // Play sound on button hovers
    document.querySelectorAll('a, button, .btn').forEach(el => {
        el.addEventListener('mouseenter', () => playBeep(800, 'sine', 0.05));
    });

    // Theme toggle sound
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => playBeep(200, 'sawtooth', 0.2));
    }


    // --- 8. Custom Cursor & Trail ---
    const cursor = document.querySelector('.custom-cursor');
    const trail = document.querySelector('.cursor-trail');
    
    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;

    
    document.addEventListener('pointermove', function mouseDetector(e) {
        if (e.pointerType === 'mouse') {
            document.body.classList.add('has-mouse');
            document.removeEventListener('pointermove', mouseDetector);
        }
    });
    
    document.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Move immediate cursor instantly
        if (cursor) {
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        }
    });

        // Animation loop for trail
        function animateTrail() {
            trailX += (mouseX - trailX) * 0.2; // ease factor
            trailY += (mouseY - trailY) * 0.2;
            if (trail) {
                trail.style.left = trailX + 'px';
                trail.style.top = trailY + 'px';
            }
            requestAnimationFrame(animateTrail);
        }
        animateTrail();

    // Hover effects
    document.querySelectorAll('a, button, input, .project-card, .btn').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });


    // --- 9. Scroll Progress Bar ---
    const scrollProgress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        const bodyScroll = document.body.scrollHeight || 0;
        const docScroll = document.documentElement.scrollHeight || 0;
        const totalHeight = Math.max(bodyScroll, docScroll);
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const docHeight = totalHeight - windowHeight;

        const scrollPercent = (scrollTop / docHeight) * 100;
        if (scrollProgress) {
            scrollProgress.style.width = scrollPercent + '%';
        }
    });


    // --- 10. Interactive Terminal ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalBody = document.getElementById('terminal-body');

    if (terminalInput) {
        terminalInput.addEventListener('input', () => {
            playBeep(400 + Math.random() * 100, 'square', 0.02);
        });
        terminalInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const cmd = this.value.trim().toLowerCase();
                this.value = '';
                
                // Print command
                printTerminalLine(`<span class="prompt">contihan@mainframe:~$</span> ${cmd}`);
                
                // Process command
                processCommand(cmd);
                
                // Scroll to bottom
                terminalBody.scrollTop = terminalBody.scrollHeight;
                
                playBeep(300, 'square', 0.1); // Keyboard hit sound
            }
        });

        function printTerminalLine(html) {
            const div = document.createElement('div');
            div.className = 'terminal-line';
            div.innerHTML = html;
            // Insert before the input line
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
                    printTerminalLine('Available commands: <br> - <span class="highlight-cmd">whoami</span>: Display user info<br> - <span class="highlight-cmd">skills</span>: List technical stack<br> - <span class="highlight-cmd">clear</span>: Clear terminal<br> - <span class="highlight-cmd">projects</span>: Jump to projects');
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
                case 'matrix':
                    printTerminalLine('Initializing Matrix protocol...');
                    setTimeout(triggerMatrix, 1000);
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
        
        // Terminal Window controls click focus
        const termWin = document.querySelector('.terminal-window');
        if (termWin) {
            termWin.addEventListener('click', () => {
                terminalInput.focus();
            });
        }
    }

    // --- 11. 3D Tilt Effect for Desktop ---
    const cards = document.querySelectorAll('.project-card');
    
    cards.forEach(card => {
        card.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return; // ignore touch taps on mobile
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // max 10 deg
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // --- 12. Konami Code (Desktop & Mobile Swipes) ---
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    // Desktop Keyboard
    document.addEventListener('keydown', (e) => {
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

    // Mobile Swipe
    let touchStartX = 0, touchStartY = 0;
    let swipeSequence = [];
    const expectedSwipes = ['UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT'];
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

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
    }, {passive: true});

    
    function triggerKonami() {
        playBeep(200, 'sawtooth', 0.5);
        playBeep(400, 'sawtooth', 0.5, 0.5);
        playBeep(600, 'sawtooth', 0.5, 1.0);
        
        document.body.classList.add('konami-active');
        
        // Let it glitch for 3 seconds then recover
        setTimeout(() => {
            document.body.classList.remove('konami-active');
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
        
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~'.split('');
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

});
