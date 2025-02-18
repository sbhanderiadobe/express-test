import {
  createTag,
  loadCSS,
} from '../../scripts/utils.js';

function buildPagination(wrapper, payload) {
  const paginationContainer = createTag('div', { class: 'pagination-container' });
  const tray = wrapper.querySelector('.paginated-carousel-tray');
  const originalCItems = tray.querySelectorAll('.paginated-carousel-item.original');

  if (originalCItems.length > 0) {
    originalCItems.forEach((cItem) => {
      const dot = createTag('span', { class: 'pagination-dot' });
      dot.dataset.carouselIndex = cItem.dataset.carouselIndex;
      paginationContainer.append(dot);

      dot.addEventListener('click', () => {
        const offset = payload.backwardInfinite ? originalCItems.length * cItem.offsetWidth : 0;
        tray.scrollTo({
          left: offset + (cItem.offsetWidth * dot.dataset.carouselIndex),
          behavior: 'smooth',
        });
      });
    });
  }

  wrapper.append(paginationContainer);
}

function initCarousel(container, payload) {
  const tray = container.querySelector('.paginated-carousel-tray');
  const originalCards = tray.querySelectorAll('.paginated-carousel-item.original');
  const paginationDots = tray.parentElement.querySelectorAll('.pagination-dot');

  const onScroll = (entries) => {
    entries.forEach((entry) => {
      const card = entry.target;

      if (entry.isIntersecting) {
        payload.currentIndex = entry.target.dataset.carouselIndex;
        paginationDots.forEach((dot) => {
          if (dot !== paginationDots[payload.currentIndex]) {
            dot.classList.remove('active');
          }
        });
        paginationDots[payload.currentIndex].classList.add('active');

        if (payload.infinite) {
          if (card.classList.contains('prev') && payload.currentIndex === (originalCards.length - 1).toString()) {
            tray.scrollBy({ left: originalCards.length * card.offsetWidth });
          }

          if (card.classList.contains('next') && payload.currentIndex === (originalCards.length - 1).toString()) {
            tray.scrollBy({ left: -(originalCards.length * card.offsetWidth) });
          }
        }
      } else if (payload.infinite) {
        if (card.classList.contains('next') && payload.currentIndex !== (originalCards.length - 1).toString()) {
          tray.scrollBy({ left: -(originalCards.length * card.offsetWidth) });
        }

        if (card.classList.contains('prev') && payload.currentIndex !== (originalCards.length - 1).toString()) {
          tray.scrollBy({ left: originalCards.length * card.offsetWidth });
        }
      }
    });
  };

  const options = {
    root: tray,
    rootMargin: '0px',
    threshold: 1.00,
  };

  if (payload.infinite) {
    payload.cItemsNext.forEach((card) => {
      tray.append(card);
    });

    payload.cItemsPrev.reverse().forEach((card) => {
      tray.prepend(card);
    });

    tray.addEventListener('scroll', () => {
      if (!payload.backwardInfinite) {
        const prevCards = tray.querySelectorAll('.paginated-carousel-item.prev');
        prevCards.forEach((pCard) => {
          pCard.classList.remove('hidden');
        });
        payload.backwardInfinite = true;
      }
    }, { passive: true });
  }

  const scrollObserver = new IntersectionObserver(onScroll, options);

  const allCards = tray.querySelectorAll('.paginated-carousel-item');
  allCards.forEach((card) => scrollObserver.observe(card));
}

function addClickableLayer(element) {
  const anchor = element.querySelector('a');
  if (anchor && anchor.href) {
    const clickableLayer = createTag('a', {
      class: 'clickable-layer',
      href: anchor.href,
    });
    element.append(clickableLayer);
  }
}

function resetPagination(wrapper, payload) {
  const paginationDots = wrapper.querySelectorAll('.pagination-dot');
  if (paginationDots.length > 0) {
    payload.currentIndex = '0';
    paginationDots.forEach((dot) => dot.classList.remove('active'));
    paginationDots[0].classList.add('active');
  }
}

export default function buildPaginatedCarousel(selector = ':scope > *', container, infinityScrollEnabled = false) {
  loadCSS('/express/blocks/shared/paginated-carousel.css');

  const payload = {
    cItemsPrev: [],
    cItemsNext: [],
    backwardInfinite: false,
    currentIndex: 0,
    infinite: infinityScrollEnabled,
  };

  const cItems = selector ? container.querySelectorAll(selector) : container.children;

  if (cItems.length > 0) {
    const wrapper = createTag('div', { class: 'paginated-carousel-wrapper' });
    const tray = createTag('div', { class: 'paginated-carousel-tray' });

    container.className = 'paginated-carousel-container';
    container.innerHTML = '';
    wrapper.append(tray);
    container.append(wrapper);

    cItems.forEach((ci, i) => {
      const carouselItem = createTag('div', {
        class: 'paginated-carousel-item original',
        'data-carousel-index': i,
      });
      carouselItem.innerHTML = ci.innerHTML;
      addClickableLayer(carouselItem);
      tray.append(carouselItem);
    });

    if (infinityScrollEnabled) {
      for (const [key] of Object.entries(payload)) {
        if (['cItemsPrev', 'cItemsNext'].includes(key)) {
          payload[key] = Array.from(cItems).map((item, index) => {
            const carouselItem = createTag('div');
            carouselItem.innerHTML = item.innerHTML;
            carouselItem.className = key === 'cItemsPrev' ? 'paginated-carousel-item prev hidden' : 'paginated-carousel-item next';
            carouselItem.dataset.carouselIndex = index.toString();
            addClickableLayer(carouselItem);
            return carouselItem;
          });
        }
      }
    }

    buildPagination(wrapper, payload);
    initCarousel(container, payload);
    setTimeout(() => {
      if (payload.currentIndex !== 0) resetPagination(wrapper, payload);
    }, 20);
  }
}
