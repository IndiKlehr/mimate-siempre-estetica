/* ==========================================================================
   INTERACTIVIDAD Y GESTIÓN DE MODALES - MÍMATE SIEMPRE ESTÉTICA
   ========================================================================== */

// --- Lógica del menú móvil (Fuera del DOMContentLoaded para que funcione el onclick del HTML)
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        // Pequeño delay para que la animación de Tailwind funcione
        setTimeout(() => {
            menu.classList.remove('scale-y-0', 'opacity-0');
            menu.classList.add('scale-y-100', 'opacity-100');
        }, 10);
    } else {
        menu.classList.remove('scale-y-100', 'opacity-100');
        menu.classList.add('scale-y-0', 'opacity-0');
        setTimeout(() => {
            menu.classList.add('hidden');
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    /* ------------------------------------------------------------------
       1. MENÚ MÓVIL
       ------------------------------------------------------------------ */
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }

    /* ------------------------------------------------------------------
       2. BOTÓN VOLVER ARRIBA
       ------------------------------------------------------------------ */
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) { // Aparece después de bajar 400px
                backToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
                backToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
            } else {
                backToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
                backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ------------------------------------------------------------------
       3. GESTIÓN DE MODALES (Privacidad y Términos)
       ------------------------------------------------------------------ */
    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    let lastFocusedElement = null;

    const openModal = (modal) => {
        if (!modal) return;
        lastFocusedElement = document.activeElement;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const first = modal.querySelector(focusableSelector);
        if (first) first.focus();
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement) lastFocusedElement.focus();
        lastFocusedElement = null;
    };

    document.querySelectorAll('[data-modal-open]').forEach((btn) => {
        btn.addEventListener('click', () => openModal(document.getElementById(btn.getAttribute('data-modal-open'))));
    });

    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(document.getElementById(btn.getAttribute('data-modal-close'))));
    });

    const modals = document.querySelectorAll('#modal-privacidad, #modal-terminos');
    modals.forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal(modal);
        });
    });

    document.addEventListener('keydown', (event) => {
        const openModalEl = Array.from(modals).find((m) => !m.classList.contains('hidden'));
        if (!openModalEl) return;

        if (event.key === 'Escape') {
            closeModal(openModalEl);
            return;
        }

        if (event.key === 'Tab') {
            const focusables = Array.from(openModalEl.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }
    });

    /* ------------------------------------------------------------------
       4. ARIA-CURRENT DINÁMICO EN EL NAVBAR
       ------------------------------------------------------------------ */
    const navLinks = document.querySelectorAll('[data-nav]');
    const sections = Array.from(navLinks).map((link) => document.getElementById(link.getAttribute('data-nav'))).filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        const setActive = (id) => {
            navLinks.forEach((link) => {
                const isActive = link.getAttribute('data-nav') === id;
                if (link.closest('nav').classList.contains('flex-col')) {
                    // Estilos menú móvil
                    link.classList.toggle('bg-brand-lavender/50', isActive);
                    link.classList.toggle('text-brand-purple', isActive);
                    link.classList.toggle('font-bold', isActive);
                } else {
                    // Estilos menú escritorio
                    link.classList.toggle('bg-secondary-container', isActive);
                    link.classList.toggle('text-brand-purple', isActive);
                    link.classList.toggle('font-bold', isActive);
                    link.classList.toggle('text-on-surface-variant', !isActive);
                }
                if (isActive) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible.length > 0) setActive(visible[0].target.id);
            },
            { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
        );
        sections.forEach((section) => observer.observe(section));
        setActive('inicio');
    }

    /* ------------------------------------------------------------------
       5. CARRUSEL COVERFLOW (Inteligente)
       ------------------------------------------------------------------ */
    const track = document.getElementById('carousel-track');
    if (track) {
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        const nextButton = document.getElementById('btn-next');
        const prevButton = document.getElementById('btn-prev');
        
        let currentIndex = 0;
        let autoPlayInterval;
        const intervalTime = 5000;

        const updateCarousel = () => {
            clearInterval(autoPlayInterval);
            const allVideos = track.querySelectorAll('video');
            allVideos.forEach(v => { v.pause(); v.currentTime = 0; });

            slides.forEach((slide, index) => {
                let offset = index - currentIndex;
                if (offset < -Math.floor(slides.length / 2)) offset += slides.length;
                if (offset > Math.floor(slides.length / 2)) offset -= slides.length;

                if (offset === 0) {
                    slide.style.transform = `translateX(0) scale(1)`;
                    slide.style.zIndex = "20";
                    slide.style.opacity = "1";
                    slide.style.filter = "brightness(1)";
                } else if (offset === -1) {
                    slide.style.transform = `translateX(-65%) scale(0.85)`;
                    slide.style.zIndex = "10";
                    slide.style.opacity = "0.5";
                    slide.style.filter = "brightness(0.6) blur(2px)";
                } else if (offset === 1) {
                    slide.style.transform = `translateX(65%) scale(0.85)`;
                    slide.style.zIndex = "10";
                    slide.style.opacity = "0.5";
                    slide.style.filter = "brightness(0.6) blur(2px)";
                } else {
                    slide.style.transform = `translateX(${offset > 0 ? 100 : -100}%) scale(0.6)`;
                    slide.style.zIndex = "0";
                    slide.style.opacity = "0";
                }
            });

            const currentSlide = slides[currentIndex];
            const video = currentSlide.querySelector('video');

            if (video) {
                video.play();
                video.onended = () => goToNext();
            } else {
                autoPlayInterval = setInterval(goToNext, intervalTime);
            }
        };

        const goToNext = () => { currentIndex = (currentIndex + 1) % slides.length; updateCarousel(); };
        const goToPrev = () => { currentIndex = (currentIndex - 1 + slides.length) % slides.length; updateCarousel(); };

        if(nextButton && prevButton) {
            nextButton.addEventListener('click', () => goToNext());
            prevButton.addEventListener('click', () => goToPrev());
        }

        slides.forEach((slide, index) => {
            slide.addEventListener('click', () => { currentIndex = index; updateCarousel(); });
        });

        updateCarousel(); 
    }
});