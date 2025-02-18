import {
  fetchPlaceholders,
  createTag,
  getMetadata,
  getLottie,
  lazyLoadLottiePlayer,
} from '../utils.js';

export async function buildStaticFreePlanWidget() {
  const placeholders = await fetchPlaceholders();
  const widget = createTag('div', { class: 'free-plan-widget' });
  for (let i = 1; i < 3; i += 1) {
    const tagText = placeholders[`free-plan-check-${i}`];
    const textDiv = createTag('div');
    textDiv.textContent = tagText;
    widget.append(textDiv);
  }
  return widget;
}

export async function addFreePlanWidget(elem) {
  if (elem && ['yes', 'true', 'y', 'on'].includes(getMetadata('show-free-plan').toLowerCase())) {
    const placeholders = await fetchPlaceholders();
    const widget = await buildStaticFreePlanWidget();

    document.addEventListener('planscomparisonloaded', () => {
      const $learnMoreButton = createTag('a', {
        class: 'learn-more-button',
        href: '#plans-comparison-container',
      });
      const lottieWrapper = createTag('span', { class: 'lottie-wrapper' });

      $learnMoreButton.textContent = placeholders['learn-more'];
      lottieWrapper.innerHTML = getLottie('purple-arrows', '/express/icons/purple-arrows.json');
      $learnMoreButton.append(lottieWrapper);
      lazyLoadLottiePlayer();
      widget.append($learnMoreButton);

      $learnMoreButton.addEventListener('click', (e) => {
        e.preventDefault();
        // temporarily disabling smooth scroll for accurate location
        const $html = document.querySelector('html');
        $html.style.scrollBehavior = 'unset';
        const $plansComparison = document.querySelector('.plans-comparison-container');
        $plansComparison.scrollIntoView();
        $html.style.removeProperty('scroll-behavior');
      });
    });

    elem.append(widget);
    elem.classList.add('free-plan-container');
  }
}
