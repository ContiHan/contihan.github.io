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
        
        // Matrix glitch effect on theme switch (optional cool detail)
        document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 150);
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

    // --- 4. Update Footer Year ---
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
                const desc = repo.description || 'System module encrypted. No public description available.';
                
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
