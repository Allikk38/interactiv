// ===== MAP UI: УПРАВЛЕНИЕ СПИСКОМ ЖК И КАРУСЕЛЬЮ =====

// Хеш последнего рендера для предотвращения двойной перерисовки
let _lastDrawerJksHash = '';

// Обновление списка ЖК для десктопной панели
function updateDesktopDrawerList(jks) {
    const drawerList = document.getElementById('jk-drawer-list');
    if (!drawerList) return;
    
    // Вычисляем хеш текущих данных для сравнения
    const currentHash = JSON.stringify(jks.map(jk => ({
        id: jk.id,
        placed: StoreInstance.hasPlacedJk(jk.id),
        selected: StoreInstance.getSelectedJkId() === jk.id
    })));
    
    // Если данные не изменились — не перерисовываем
    if (_lastDrawerJksHash === currentHash) return;
    _lastDrawerJksHash = currentHash;
    
    drawerList.innerHTML = '';
    
    const placedJks = StoreInstance.getPlacedJks();
    const selectedJkId = StoreInstance.getSelectedJkId();
    
    jks.forEach(jk => {
        const isPlaced = placedJks.has(jk.id);
        const isSelected = selectedJkId === jk.id;
        
        const li = document.createElement('li');
        li.className = `jk-list__item${isPlaced ? ' jk-list__item--placed' : ''}${isSelected ? ' jk-list__item--selected' : ''}`;
        li.dataset.id = jk.id;
        li.innerHTML = renderDesktopDrawerItem(jk, isPlaced, isSelected);
        
        if (!isPlaced) {
            li.addEventListener('click', () => {
                if (typeof selectJk === 'function') {
                    selectJk(jk.id);
                }
                document.querySelectorAll('.jk-list__item').forEach(item => {
                    item.classList.remove('jk-list__item--selected');
                });
                li.classList.add('jk-list__item--selected');
                // Сбрасываем хеш после изменения выделения
                _lastDrawerJksHash = '';
            });
        }
        
        drawerList.appendChild(li);
    });
}

// Рендер карусели для мобильных устройств
function renderCarousel(jks) {
    const existingCarousel = document.querySelector('.jk-carousel');
    if (existingCarousel) existingCarousel.remove();
    
    if (!jks.length) return;
    
    const mapScreen = document.getElementById('map-screen');
    const progressContainer = document.querySelector('.map-progress')?.parentElement;
    
    const carouselHTML = renderCarouselHTML(jks);
    
    if (progressContainer && progressContainer.parentElement) {
        progressContainer.parentElement.insertAdjacentHTML('afterbegin', carouselHTML);
    } else {
        mapScreen.insertAdjacentHTML('afterbegin', carouselHTML);
    }
    
    const track = document.getElementById('carousel-track');
    const placedJks = StoreInstance.getPlacedJks();
    const selectedJkId = StoreInstance.getSelectedJkId();
    
    jks.forEach(jk => {
        const isPlaced = placedJks.has(jk.id);
        const isSelected = selectedJkId === jk.id;
        
        const card = document.createElement('div');
        card.className = `jk-card${isSelected ? ' jk-card--selected' : ''}${isPlaced ? ' jk-card--placed' : ''}`;
        card.dataset.id = jk.id;
        card.innerHTML = renderCarouselCard(jk, isPlaced, isSelected);
        
        if (!isPlaced) {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof selectJk === 'function') {
                    selectJk(jk.id);
                }
            });
        }
        
        track.appendChild(card);
    });
    
    initCarouselScroll();
    updateCarouselCounter();
}

// Инициализация скролла карусели
function initCarouselScroll() {
    const slides = document.getElementById('carousel-slides');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (!slides) return;
    
    const updateButtons = () => {
        if (!slides) return;
        const scrollLeft = slides.scrollLeft;
        const maxScroll = slides.scrollWidth - slides.clientWidth;
        if (prevBtn) prevBtn.disabled = scrollLeft <= 5;
        if (nextBtn) nextBtn.disabled = maxScroll <= 5 || scrollLeft >= maxScroll - 5;
    };
    
    const scroll = (direction) => {
        const scrollAmount = slides.clientWidth * 0.8;
        if (direction === 'left') {
            slides.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            slides.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
        setTimeout(updateButtons, 300);
    };
    
    if (prevBtn) prevBtn.addEventListener('click', () => scroll('left'));
    if (nextBtn) nextBtn.addEventListener('click', () => scroll('right'));
    
    slides.addEventListener('scroll', updateButtons);
    slides.addEventListener('touchstart', () => {
        setTimeout(updateButtons, 100);
    });
    
    setTimeout(updateButtons, 100);
    window.addEventListener('resize', updateButtons);
}

// Обновление счётчика карусели
function updateCarouselCounter() {
    const counter = document.getElementById('carousel-counter');
    const currentStepJks = StoreInstance.getCurrentStepJks();
    const total = currentStepJks ? currentStepJks.length : 0;
    const placed = StoreInstance.getPlacedJksSize();
    if (counter) {
        counter.textContent = renderCarouselCounter(placed, total);
    }
}

// Обновление выделенного элемента в карусели и списке
function updateSelectedCard() {
    const selectedJkId = StoreInstance.getSelectedJkId();
    
    document.querySelectorAll('.jk-card').forEach(card => {
        card.classList.remove('jk-card--selected');
        if (card.dataset.id == selectedJkId) {
            card.classList.add('jk-card--selected');
        }
    });
    document.querySelectorAll('.jk-list__item').forEach(item => {
        item.classList.remove('jk-list__item--selected');
        if (item.dataset.id == selectedJkId) {
            item.classList.add('jk-list__item--selected');
        }
    });
}
