document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('app-loader');
    const appWrap = document.querySelector('.app-wrap');

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

    // 2. Intersection Observer for Scroll Animations & Price Counting
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // If it is a card containing pricing, trigger count up
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
        threshold: 0.05,
        rootMargin: '0px 0px -30px 0px' // Trigger slightly before element is fully in view
    });

    // Observe individual item cards for staggered delays
    const itemCards = document.querySelectorAll('.menu-item-card, .subcategory-divider-wrap');
    itemCards.forEach(card => {
        revealObserver.observe(card);
    });

    // Observe sections and banner
    revealElements.forEach(el => revealObserver.observe(el));

    // 3. Count-up Price Function
    function countUp(element, target) {
        let current = 0;
        const duration = 1000; // 1 second
        let startTimestamp = null;

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

    // 4. Ripple Interaction Effect (Tap Feedback)
    const cards = document.querySelectorAll('.menu-item-card, .footer-phone');
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
