import {
  createTag, getIconElement,
  loadCSS,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

function buildButton($button, $options, option) {
  $button.innerHTML = '';

  if (option.text) {
    const $text = createTag('span', { class: 'dropdown-button-text' });
    $text.textContent = option.text;
    $button.append($text);

    if (option.icon) {
      const $icon = option.icon.cloneNode(true);
      $icon.classList.add('dropdown-button-icon');
      $text.prepend($icon);
    }

    $button.append(getIconElement('drop-down-arrow'));

    $button.addEventListener('click', (e) => {
      e.preventDefault();

      $options.classList.add('active');
    });
  }
}

function buildOptions($button, $options, options, callback) {
  options.forEach((option) => {
    const $option = createTag('div', { class: 'dropdown-option' });

    if (option.icon) {
      const $icon = option.icon.cloneNode(true);
      $icon.classList.add('dropdown-option-icon');
      $option.append($icon);
    }

    if (option.text) {
      const $text = createTag('span', { class: 'dropdown-option-text' });
      $text.textContent = option.text;
      $option.append($text);
    }

    if (option.value) {
      $option.dataset.value = option.value;
    }

    $option.addEventListener('click', (e) => {
      e.preventDefault();

      buildButton($button, $options, option);

      if (typeof callback === 'function') {
        callback(option);
      }

      $options.classList.remove('active');
    });

    $options.append($option);
  });

  $options.append(getIconElement('drop-down-arrow'));

  document.body.addEventListener('click', (e) => {
    if (!e.target.classList.contains('dropdown-button')) {
      if ($options.classList.contains('active')) {
        $options.classList.remove('active');
      }
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export function buildDropdown(options, attrs = null, callback) {
  if (!Array.isArray(options)) return null;
  if (typeof callback !== 'function') return null;

  loadCSS('/express/blocks/shared/dropdown.css', null);

  const $dropdown = createTag('div', { class: 'dropdown' });
  const $button = createTag('div', { class: 'dropdown-button' });
  const $options = createTag('div', { class: 'dropdown-options' });

  buildOptions($button, $options, options, callback);
  buildButton($button, $options, options[0]);

  $dropdown.append($button);
  $dropdown.append($options);

  if (typeof attrs === 'object') {
    for (const [key, value] of Object.entries(attrs)) {
      $dropdown.setAttribute(key, value);
    }
  }

  return $dropdown;
}
