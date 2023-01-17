/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  createTag,
  getIconElement,
  getLottie,
  getMobileOperatingSystem,
} from '../../scripts/scripts.js';

import {
  createFloatingButton,
  showScrollArrow,
  hideScrollArrow,
  collectFloatingButtonData,
} from '../shared/floating-cta.js';

function decorateBadge() {
  const $anchor = createTag('a');
  const OS = getMobileOperatingSystem();

  if ($anchor) {
    $anchor.textContent = '';
    $anchor.classList.add('badge');

    if (OS === 'iOS') {
      $anchor.append(getIconElement('apple-store'));
    } else {
      $anchor.append(getIconElement('google-store'));
    }
  }

  return $anchor;
}

function toggleToolBox($wrapper, $lottie, data, userInitiated = true) {
  const $toolbox = $wrapper.querySelector('.toolbox');
  const $button = $wrapper.querySelector('.floating-button');

  if (userInitiated) {
    $wrapper.classList.remove('initial-load');
  }

  if ($wrapper.classList.contains('toolbox-opened')) {
    const $scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
    if (data.scrollState === 'withLottie' && $scrollAnchor) {
      showScrollArrow($wrapper, $lottie);
    }
    $wrapper.classList.remove('toolbox-opened');
    if (userInitiated) {
      setTimeout(() => {
        if (!$wrapper.classList.contains('toolbox-opened')) {
          $toolbox.classList.add('hidden');
          $wrapper.classList.remove('clamped');
          $button.classList.remove('toolbox-opened');
        }
      }, 500);
    } else {
      setTimeout(() => {
        if ($wrapper.classList.contains('initial-load')) {
          $toolbox.classList.add('hidden');
          $wrapper.classList.remove('clamped');
          $button.classList.remove('toolbox-opened');
        }
      }, 2000);
    }
  } else {
    $toolbox.classList.remove('hidden');
    $wrapper.classList.add('clamped');
    $button.classList.add('toolbox-opened');
    hideScrollArrow($wrapper, $lottie);

    setTimeout(() => {
      $wrapper.classList.add('toolbox-opened');
    }, 10);
  }
}

function initNotchDragAction($wrapper, data) {
  const $body = document.querySelector('body');
  const $notch = $wrapper.querySelector('.notch');
  const $toolBox = $wrapper.querySelector('.toolbox');
  const $lottie = $wrapper.querySelector('.floating-button-lottie');
  let touchStart = 0;
  const initialHeight = $toolBox.offsetHeight;
  $notch.addEventListener('touchstart', (e) => {
    $body.style.overflow = 'hidden';
    $toolBox.style.transition = 'none';
    touchStart = e.changedTouches[0].clientY;
  }, { passive: true });

  $notch.addEventListener('touchmove', (e) => {
    $toolBox.style.maxHeight = `${initialHeight - (e.changedTouches[0].clientY - touchStart)}px`;
  }, { passive: true });

  $notch.addEventListener('touchend', (e) => {
    $body.style.removeProperty('overflow');

    if (e.changedTouches[0].clientY - touchStart > 100) {
      toggleToolBox($wrapper, $lottie, data);
    } else {
      $toolBox.style.maxHeight = `${initialHeight}px`;
    }

    $toolBox.removeAttribute('style');
  }, { passive: true });
}

function buildMultifunctionToolBox($wrapper, data) {
  const $toolBox = createTag('div', { class: 'toolbox' });
  const $notch = createTag('a', { class: 'notch' });
  const $notchPill = createTag('div', { class: 'notch-pill' });
  const $appStoreBadge = decorateBadge();
  const $background = createTag('div', { class: 'toolbox-background' });
  const $floatingButton = $wrapper.querySelector('.floating-button');
  const $cta = $floatingButton.querySelector('a');
  const $toggleButton = createTag('a', { class: 'toggle-button' });
  const $toggleIcon = getIconElement('plus-icon-22');
  const $lottie = $wrapper.querySelector('.floating-button-lottie');
  const $boxTop = createTag('div', { class: 'toolbox-top' });
  const $boxBottom = createTag('div', { class: 'toolbox-bottom' });

  data.tools.forEach((tool, index) => {
    const $tool = createTag('div', { class: 'tool' });
    $tool.append(tool.icon, tool.anchor);

    if (index < data.toolsToStash) {
      $boxTop.append($tool);
    } else {
      $boxBottom.append($tool);
    }
  });

  $appStoreBadge.href = data.appStore.href ? data.appStore.href : data.tools[0].anchor.href;

  $wrapper.classList.add('initial-load');
  $wrapper.classList.add('clamped');
  $wrapper.classList.add('toolbox-opened');
  $floatingButton.classList.add('toolbox-opened');
  hideScrollArrow($wrapper, $lottie);

  setTimeout(() => {
    if ($wrapper.classList.contains('initial-load')) {
      toggleToolBox($wrapper, $lottie, data, false);
    }
  }, data.delay * 1000);

  $toggleButton.innerHTML = getLottie('plus-animation', '/express/icons/plus-animation.json');
  $toolBox.append($boxTop, $boxBottom);
  $toggleButton.append($toggleIcon);
  $floatingButton.append($toggleButton);
  $notch.append($notchPill);
  $toolBox.append($notch, $appStoreBadge);
  $wrapper.append($toolBox, $background);

  $cta.addEventListener('click', (e) => {
    if (!$wrapper.classList.contains('toolbox-opened')) {
      e.preventDefault();
      e.stopPropagation();
      toggleToolBox($wrapper, $lottie, data);
    }
  });

  [$toggleButton, $notch, $background].forEach(($element) => {
    if ($element) {
      $element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleToolBox($wrapper, $lottie, data);
      });
    }
  });

  initNotchDragAction($wrapper, data);
}

export async function createMultiFunctionButton($block, data, audience) {
  const $buttonWrapper = await createFloatingButton($block, audience, data)
    .then(((result) => result));
  $buttonWrapper.classList.add('multifunction');
  buildMultifunctionToolBox($buttonWrapper, data);
}

export default async function decorateBlock($block) {
  const audience = $block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    $block.closest('.section').remove();
  }

  const data = await collectFloatingButtonData();
  await createMultiFunctionButton($block, data, audience);
}
