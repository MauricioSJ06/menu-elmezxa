document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('app-loader');
    const appWrap = document.querySelector('.app-wrap');
    const particleContainer = document.getElementById('particle-container');

    // 1. Initial Loader Transition
    setTimeout(() => {
        loader.style.opacity = '0';
        appWrap.style.display = 'block';
        setTimeout(() => {
            loader.style.display = 'none';
            // Trigger initial scroll check
            window.dispatchEvent(new Event('scroll'));
        }, 600);
    }, 1600); // 1.6 seconds to let the liquid fill animation finish

    // 2. Background Particle Emitter System (Limes & Agaves)
    const particleSVGDefs = [
        // Agave Outline
        `<path d="M25 50 C20 35 15 25 5 15 C12 25 20 35 25 50 C25 35 33 25 45 15 C35 25 30 35 25 50 Z M25 50 C22 40 18 32 10 25 C15 32 20 40 25 50 C25 40 30 40 40 25 C32 32 28 40 25 50 Z" />`,
        // Lime Slice
        `<path d="M25 0 A25 25 0 1 1 24.9 0 Z M25 4 A21 21 0 1 0 25.1 4 Z M25 6 L25 22 M25 28 L25 44 M6 25 L22 25 M28 25 L44 25 M11.5 11.5 L22 22 M28 28 L38.5 38.5 M11.5 38.5 L22 28 M28 22 L38.5 11.5" stroke-width="2.5" stroke-linecap="round" fill="none" />`
    ];

    function createParticle() {
        if (!particleContainer) return;

        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('viewBox', '0 0 50 50');
        svgElement.classList.add('particle');
        
        // Randomly select agave or lime
        const randomPath = particleSVGDefs[Math.floor(Math.random() * particleSVGDefs.length)];
        svgElement.innerHTML = randomPath;

        // Randomize physics & presentation
        const size = Math.random() * 30 + 20; // 20px to 50px
        const left = Math.random() * 100; // 0% to 100% viewport width
        const duration = Math.random() * 6 + 7; // 7s to 13s
        const color = Math.random() > 0.5 ? 'var(--brand-pink)' : 'var(--brand-orange)';

        svgElement.style.width = `${size}px`;
        svgElement.style.height = `${size}px`;
        svgElement.style.left = `${left}%`;
        svgElement.style.fill = color;
        svgElement.style.stroke = color;
        svgElement.style.animationDuration = `${duration}s`;

        particleContainer.appendChild(svgElement);

        // Remove element after animation completes to avoid memory leaks
        svgElement.addEventListener('animationend', () => {
            svgElement.remove();
        });
    }

    // Emit initial particles and set interval
    for (let i = 0; i < 5; i++) {
        setTimeout(createParticle, Math.random() * 4000);
    }
    setInterval(createParticle, 2000);

    // 3. Intersection Observer for Scroll Animations & Price Counting
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // If it is a card or section containing pricing, trigger count up
                const priceElements = entry.target.querySelectorAll('.item-price');
                priceElements.forEach(priceEl => {
                    const priceVal = priceEl.querySelector('.price-val');
                    if (priceVal && priceVal.innerText === '0') {
                        const targetPrice = parseInt(priceEl.getAttribute('data-price'), 10);
                        countUp(priceVal, targetPrice);
                    }
                });
                
                // Unobserve since animation is triggered once
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully in view
    });

    // Also observe individual item cards for staggered delays
    const itemCards = document.querySelectorAll('.menu-item-card');
    itemCards.forEach(card => {
        // Wrap card in Observer if it is not inside a pre-observed parent, 
        // but since section title and items look better popping up individually,
        // we observe each card.
        revealObserver.observe(card);
    });

    // Observe sections and banner
    revealElements.forEach(el => revealObserver.observe(el));

    // 4. Count-up Price Function
    function countUp(element, target) {
        let current = 0;
        const duration = 1000; // 1 second
        const startTimestamp = performance.now();

        function step(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function (easeOutQuad)
            const easeProgress = progress * (2 - progress);
            current = Math.floor(easeProgress * target);
            element.innerText = current;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.innerText = target;
            }
        }

        window.requestAnimationFrame(step);
    }

    // 5. Ripple Interaction Effect (Tap Feedback)
    const cards = document.querySelectorAll('.menu-item-card, .footer-phone, .whatsapp-float');
    cards.forEach(card => {
        card.classList.add('ripple-active');
        card.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            this.appendChild(ripple);

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    });
});
