// ============================================================
// АНИМАЦИИ ДЛЯ ЛЕНДИНГА
// Версия: 3.0 — Финальная адаптивная версия
// Зависимости: GSAP, ScrollTrigger
// ============================================================

(function() {
    'use strict';

    // Проверяем, загружены ли GSAP и ScrollTrigger
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('[Landing] GSAP или ScrollTrigger не загружены, анимации отключены');
        return;
    }

    // Регистрируем ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Проверяем, не отключены ли анимации
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('[Landing] Reduced motion detected, animations disabled');
        return;
    }

    console.log('[Landing] Инициализация анимаций...');

    // ============================================================
    // 1. ОПРЕДЕЛЕНИЕ ТИПА УСТРОЙСТВА
    // ============================================================

    function getDeviceType() {
        const width = window.innerWidth;
        if (width <= 480) return 'mobile-small';
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    let deviceType = getDeviceType();
    let isMobile = deviceType === 'mobile' || deviceType === 'mobile-small';

    // ============================================================
    // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================

    function getAnimationConfig() {
        const config = {
            duration: isMobile ? 0.5 : 0.8,
            ease: isMobile ? 'power2.out' : 'power3.out',
            y: isMobile ? 20 : 40,
            stagger: isMobile ? 0.06 : 0.1,
        };

        if (!isMobile) {
            config.ease = 'back.out(1.7)';
            config.scale = 0.92;
        }

        return config;
    }

    function getSimpleAnimationConfig() {
        return {
            duration: isMobile ? 0.4 : 0.6,
            ease: 'power2.out',
            y: isMobile ? 15 : 30,
        };
    }

    // ============================================================
    // 3. ГЕРОЙ-СЕКЦИЯ
    // ============================================================

    function animateHero() {
        const heroTitle = document.querySelector('.landing-hero__title');
        const heroSubtitle = document.querySelector('.landing-hero__subtitle');
        const heroBadge = document.querySelector('.landing-hero__badge');
        const heroMockup = document.querySelector('.landing-hero__mockup');
        const heroStats = document.querySelectorAll('.landing-hero__stat-item');
        const heroButtons = document.querySelectorAll('.landing-hero__btn');

        const config = getSimpleAnimationConfig();

        if (heroBadge) {
            gsap.from(heroBadge, {
                opacity: 0,
                y: -15,
                duration: config.duration,
                ease: config.ease,
                delay: 0.1,
            });
        }

        if (heroTitle) {
            gsap.from(heroTitle, {
                opacity: 0,
                y: config.y,
                duration: config.duration + 0.2,
                ease: config.ease,
                delay: 0.2,
            });
        }

        if (heroSubtitle) {
            gsap.from(heroSubtitle, {
                opacity: 0,
                y: config.y * 0.8,
                duration: config.duration,
                ease: config.ease,
                delay: 0.3,
            });
        }

        if (heroButtons.length > 0) {
            gsap.from(heroButtons, {
                opacity: 0,
                y: config.y,
                stagger: isMobile ? 0.08 : 0.12,
                duration: config.duration,
                ease: 'back.out(1.7)',
                delay: 0.4,
            });
        }

        if (heroStats.length > 0) {
            gsap.from(heroStats, {
                opacity: 0,
                y: config.y,
                stagger: isMobile ? 0.08 : 0.1,
                duration: config.duration,
                ease: config.ease,
                delay: 0.5,
            });
        }

        if (heroMockup) {
            const mockupConfig = {
                opacity: 0,
                y: config.y + 10,
                duration: config.duration + 0.3,
                ease: config.ease,
                delay: 0.3,
            };

            if (!isMobile) {
                mockupConfig.scale = 0.95;
            }

            gsap.from(heroMockup, mockupConfig);
        }
    }

    // ============================================================
    // 4. SCROLL-DRIVEN АНИМАЦИЯ ДЛЯ ГЕРОЯ
    // ============================================================

    function animateHeroScroll() {
        if (isMobile) return;

        const heroContent = document.querySelector('.landing-hero__content');
        const heroMockup = document.querySelector('.landing-hero__mockup');

        if (heroContent) {
            gsap.to(heroContent, {
                scrollTrigger: {
                    trigger: '.landing-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.2,
                    invalidateOnRefresh: true,
                },
                y: -50,
                opacity: 0.4,
                ease: 'power1.out',
            });
        }

        if (heroMockup) {
            gsap.to(heroMockup, {
                scrollTrigger: {
                    trigger: '.landing-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.2,
                    invalidateOnRefresh: true,
                },
                scale: 1.03,
                y: -20,
                ease: 'power1.out',
            });
        }
    }

    // ============================================================
    // 5. СЕКЦИЯ "ДЛЯ КОГО"
    // ============================================================

    function animateBenefits() {
        const cards = document.querySelectorAll('.landing-benefit');
        if (cards.length === 0) return;

        const config = getAnimationConfig();

        gsap.from(cards, {
            scrollTrigger: {
                trigger: '#for-whom .landing-benefits',
                start: isMobile ? 'top 92%' : 'top 85%',
                toggleActions: 'play none none reverse',
            },
            opacity: 0,
            y: config.y,
            scale: isMobile ? 0.95 : 0.9,
            stagger: config.stagger,
            duration: config.duration,
            ease: config.ease,
        });
    }

    // ============================================================
    // 6. СЕКЦИЯ "КАК ЭТО РАБОТАЕТ"
    // ============================================================

    function animateHowItWorks() {
        if (isMobile) {
            // На мобильных — просто показываем все шаги
            document.querySelectorAll('.how-it-works-step').forEach(function(step) {
                step.classList.add('active');
            });
            return;
        }

        const steps = document.querySelectorAll('.how-it-works-step');
        const dots = document.querySelectorAll('.how-it-works-progress__dot');
        const totalSteps = steps.length;

        if (steps.length === 0 || dots.length === 0) return;

        steps[0].classList.add('active');
        dots[0].classList.add('active');

        steps.forEach(function(step, index) {
            const trigger = document.createElement('div');
            trigger.style.position = 'absolute';
            trigger.style.top = (index / totalSteps) * 100 + '%';
            trigger.style.height = (100 / totalSteps) + '%';
            trigger.style.left = '0';
            trigger.style.right = '0';
            trigger.style.pointerEvents = 'none';
            trigger.style.zIndex = '1';

            const stickyEl = document.getElementById('howItWorksSticky');
            if (stickyEl) {
                stickyEl.appendChild(trigger);
            }

            ScrollTrigger.create({
                trigger: trigger,
                start: 'top bottom',
                end: 'top top',
                onEnter: function() {
                    steps.forEach(function(s) {
                        s.classList.remove('active', 'exit');
                    });
                    step.classList.add('active');

                    dots.forEach(function(dot, i) {
                        dot.classList.remove('active', 'done');
                        if (i === index) dot.classList.add('active');
                        if (i < index) dot.classList.add('done');
                    });
                },
                onEnterBack: function() {
                    steps.forEach(function(s) {
                        s.classList.remove('active', 'exit');
                    });
                    step.classList.add('active');

                    dots.forEach(function(dot, i) {
                        dot.classList.remove('active', 'done');
                        if (i === index) dot.classList.add('active');
                        if (i < index) dot.classList.add('done');
                    });
                },
                onLeave: function() {
                    step.classList.remove('active');
                    step.classList.add('exit');
                },
                onLeaveBack: function() {
                    step.classList.remove('active', 'exit');
                },
                invalidateOnRefresh: true,
            });
        });
    }

    // ============================================================
    // 7. СЕКЦИЯ "ЧТО ВНУТРИ"
    // ============================================================

    function animateFeatures() {
        const cards = document.querySelectorAll('.landing-feature');
        if (cards.length === 0) return;

        const config = getAnimationConfig();

        gsap.from(cards, {
            scrollTrigger: {
                trigger: '#features .landing-features-grid',
                start: isMobile ? 'top 92%' : 'top 85%',
                toggleActions: 'play none none reverse',
            },
            opacity: 0,
            y: config.y,
            x: isMobile ? 0 : 20,
            stagger: config.stagger,
            duration: config.duration,
            ease: config.ease,
        });
    }

    // ============================================================
    // 8. CTA-СЕКЦИЯ
    // ============================================================

    function animateCTA() {
        const title = document.querySelector('.landing-cta__title');
        const subtitle = document.querySelector('.landing-cta__subtitle');
        const button = document.querySelector('.landing-cta__btn');

        const config = getSimpleAnimationConfig();

        if (title) {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: '.landing-cta',
                    start: isMobile ? 'top 92%' : 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                opacity: 0,
                y: config.y,
                duration: config.duration,
                ease: config.ease,
            });
        }

        if (subtitle) {
            gsap.from(subtitle, {
                scrollTrigger: {
                    trigger: '.landing-cta',
                    start: isMobile ? 'top 92%' : 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                opacity: 0,
                y: config.y * 0.8,
                duration: config.duration,
                ease: config.ease,
                delay: isMobile ? 0.05 : 0.1,
            });
        }

        if (button) {
            const btnConfig = {
                opacity: 0,
                y: config.y,
                duration: config.duration,
                ease: 'back.out(1.7)',
                delay: isMobile ? 0.1 : 0.2,
            };

            if (!isMobile) {
                btnConfig.scale = 0.92;
            }

            gsap.from(button, {
                scrollTrigger: {
                    trigger: '.landing-cta',
                    start: isMobile ? 'top 92%' : 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                ...btnConfig,
            });
        }
    }

    // ============================================================
    // 9. СЧЁТЧИКИ
    // ============================================================

    function animateCounters() {
        document.querySelectorAll('.stat-number').forEach(function(element) {
            const target = parseInt(element.dataset.target);
            if (isNaN(target) || target === 0) return;

            const obj = { value: 0 };

            gsap.to(obj, {
                value: target,
                scrollTrigger: {
                    trigger: element,
                    start: 'top 92%',
                    toggleActions: 'play none none reverse',
                },
                duration: isMobile ? 1.2 : 1.8,
                ease: 'power3.out',
                onUpdate: function() {
                    element.textContent = Math.round(obj.value);
                },
                onComplete: function() {
                    element.textContent = target;
                },
            });
        });
    }

    // ============================================================
    // 10. МИКРО-ВЗАИМОДЕЙСТВИЯ
    // ============================================================

    function initMicroInteractions() {
        if (isMobile) return;

        const ctaButton = document.querySelector('.landing-cta__btn');
        if (ctaButton) {
            ctaButton.addEventListener('mouseenter', function() {
                gsap.to(this, {
                    scale: 1.03,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });

            ctaButton.addEventListener('mouseleave', function() {
                gsap.to(this, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });
        }

        // Анимация для карточек при наведении
        document.querySelectorAll('.landing-benefit, .landing-feature').forEach(function(card) {
            card.addEventListener('mouseenter', function() {
                gsap.to(this, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });

            card.addEventListener('mouseleave', function() {
                gsap.to(this, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });
        });
    }

    // ============================================================
    // 11. ОБНОВЛЕНИЕ ПРИ РЕСАЙЗЕ
    // ============================================================

    function initResizeHandler() {
        let resizeTimeout;
        let lastWidth = window.innerWidth;

        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                const newWidth = window.innerWidth;
                const newDeviceType = getDeviceType();
                const newIsMobile = newDeviceType === 'mobile' || newDeviceType === 'mobile-small';

                // Если изменился тип устройства — обновляем состояние
                if (isMobile !== newIsMobile) {
                    isMobile = newIsMobile;
                    deviceType = newDeviceType;

                    // Обновляем анимации
                    ScrollTrigger.refresh();

                    // Перезапускаем микро-взаимодействия
                    initMicroInteractions();
                }

                lastWidth = newWidth;
            }, 300);
        });
    }

    // ============================================================
    // 12. ЗАПУСК ВСЕХ АНИМАЦИЙ
    // ============================================================

    function initAllAnimations() {
        // Запускаем анимации с небольшой задержкой для плавного старта
        setTimeout(function() {
            animateHero();
            animateHeroScroll();
            animateBenefits();
            animateHowItWorks();
            animateFeatures();
            animateCTA();
            animateCounters();
            initMicroInteractions();
            initResizeHandler();

            // Обновляем ScrollTrigger после загрузки всех анимаций
            setTimeout(function() {
                ScrollTrigger.refresh();
            }, 500);

            console.log('[Landing] Все анимации запущены (устройство: ' + deviceType + ')');
        }, 100);
    }

    // ============================================================
    // 13. ОЧИСТКА ПРИ УНИЧТОЖЕНИИ
    // ============================================================

    window.addEventListener('beforeunload', function() {
        ScrollTrigger.getAll().forEach(function(st) {
            st.kill();
        });
    });

    // ============================================================
    // 14. ЗАПУСК
    // ============================================================

    // Если страница уже загружена — запускаем сразу
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initAllAnimations();
    } else {
        document.addEventListener('DOMContentLoaded', initAllAnimations);
    }

})();