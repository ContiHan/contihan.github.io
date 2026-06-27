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
        document.body.classList.add('theme-transition-glitch');
        setTimeout(() => {
            document.body.classList.remove('theme-transition-glitch');
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
