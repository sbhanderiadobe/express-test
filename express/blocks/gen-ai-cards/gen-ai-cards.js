import { createTag, fetchPlaceholders } from '../../scripts/utils.js';

import buildCarousel from '../shared/carousel.js';

const genAIPlaceholder = '%7B%7Bprompt-text%7D%7D';

export function decorateTextWithTag(textSource, options = {}) {
  const {
    baseT,
    tagT,
    baseClass,
    tagClass,
  } = options;
  const text = createTag(baseT || 'p', { class: baseClass || '' });
  const tagText = textSource.match(/\[(.*?)]/);

  if (tagText) {
    const [fullText, tagTextContent] = tagText;
    const $tag = createTag(tagT || 'span', { class: tagClass || 'tag' });
    text.textContent = textSource.replace(fullText, '').trim();
    text.dataset.text = text.textContent.toLowerCase();
    $tag.textContent = tagTextContent;
    text.append($tag);
  } else {
    text.textContent = textSource;
    text.dataset.text = text.textContent.toLowerCase();
  }
  return text;
}

export function decorateHeading(block, payload) {
  const headingSection = createTag('div', { class: 'gen-ai-cards-heading-section' });
  const headingTextWrapper = createTag('div', { class: 'text-wrapper' });
  const heading = createTag('h2', { class: 'gen-ai-cards-heading' });

  heading.textContent = payload.heading;
  headingSection.append(headingTextWrapper);
  headingTextWrapper.append(heading);

  if (payload.subHeadings.length > 0) {
    payload.subHeadings.forEach((p) => {
      headingTextWrapper.append(p);
    });
  }

  if (payload.legalLink.href !== '') {
    const legalButton = createTag('a', {
      class: 'gen-ai-cards-link',
      href: payload.legalLink.href,
    });
    legalButton.textContent = payload.legalLink.text;
    headingSection.append(legalButton);
  }

  block.append(headingSection);
}

export const windowHelper = {
  redirect: (url) => {
    window.location.assign(url);
  },
};

function handleGenAISubmit(form, link) {
  const input = form.querySelector('input');
  if (input.value.trim() === '') return;
  const genAILink = link.replace(genAIPlaceholder, encodeURI(input.value).replaceAll(' ', '+'));
  if (genAILink) windowHelper.redirect(genAILink);
}

function buildGenAIForm({ ctaLinks, subtext }) {
  const genAIForm = createTag('form', { class: 'gen-ai-input-form' });
  const genAIInput = createTag('input', {
    placeholder: subtext || '',
    type: 'text',
    enterKeyhint: 'enter',
  });
  const genAISubmit = createTag('button', {
    class: 'gen-ai-submit',
    type: 'submit',
    disabled: true,
  });

  genAIForm.append(genAIInput, genAISubmit);

  genAISubmit.textContent = ctaLinks[0].textContent;
  genAISubmit.disabled = genAIInput.value === '';

  genAIInput.addEventListener('input', () => {
    genAISubmit.disabled = genAIInput.value.trim() === '';
  });

  genAIInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenAISubmit(genAIForm, ctaLinks[0].href);
    }
  });

  genAIForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenAISubmit(genAIForm, ctaLinks[0].href);
  });

  return genAIForm;
}

function removeLazyAfterNeighborLoaded(image, lastImage) {
  if (!image || !lastImage) return;
  lastImage.onload = (e) => {
    if (e.eventPhase >= Event.AT_TARGET) {
      image.querySelector('img').removeAttribute('loading');
    }
  };
}

async function decorateCards(block, { actions }) {
  const cards = createTag('div', { class: 'gen-ai-cards-cards' });
  const placeholders = await fetchPlaceholders();

  actions.forEach((cta, i) => {
    const {
      image,
      ctaLinks,
      text,
      title,
    } = cta;
    const card = createTag('div', { class: 'card' });
    const linksWrapper = createTag('div', { class: 'links-wrapper' });
    const mediaWrapper = createTag('div', { class: 'media-wrapper' });
    const textWrapper = createTag('div', { class: 'text-wrapper' });

    card.append(textWrapper, mediaWrapper, linksWrapper);
    if (image) {
      mediaWrapper.append(image);
      if (i > 0) {
        const lastImage = actions[i - 1].image?.querySelector('img');
        removeLazyAfterNeighborLoaded(image, lastImage);
      }
    }

    const hasGenAIForm = (new RegExp(genAIPlaceholder).test(ctaLinks?.[0]?.href));

    if (ctaLinks.length > 0) {
      if (hasGenAIForm) {
        const genAIForm = buildGenAIForm(cta);
        card.classList.add('gen-ai-action');
        card.append(genAIForm);
        linksWrapper.remove();
      } else {
        const a = ctaLinks[0];
        const btnUrl = new URL(a.href);
        if (placeholders?.['search-branch-links']?.replace(/\s/g, '').split(',').includes(`${btnUrl.origin}${btnUrl.pathname}`)) {
          btnUrl.searchParams.set('search', cta.text);
          btnUrl.searchParams.set('q', cta.text);
          btnUrl.searchParams.set('category', 'templates');
          btnUrl.searchParams.set('searchCategory', 'templates');
          a.href = decodeURIComponent(btnUrl.toString());
        }
        a.removeAttribute('title');
        linksWrapper.append(a);
      }
    }

    const titleText = decorateTextWithTag(title, { tagT: 'sup', baseClass: 'cta-card-title' });
    textWrapper.append(titleText);
    const desc = createTag('p', { class: 'cta-card-desc' });
    desc.textContent = text;
    textWrapper.append(desc);

    cards.append(card);
  });

  block.append(cards);
}

function constructPayload(block) {
  const rows = Array.from(block.children);
  block.innerHTML = '';
  const headingDiv = rows.shift();

  const payload = {
    heading: headingDiv.querySelector('h2, h3, h4, h5, h6')?.textContent?.trim(),
    subHeadings: headingDiv.querySelectorAll('p:not(.button-container)'),
    legalLink: {
      text: headingDiv.querySelector('a.button')?.textContent?.trim(),
      href: headingDiv.querySelector('a.button')?.href,
    },
    actions: [],
  };

  rows.forEach((row) => {
    const ctaObj = {
      image: row.querySelector(':scope > div:nth-of-type(1) picture'),
      videoLink: row.querySelector(':scope > div:nth-of-type(1) a'),
      title: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container) strong')?.textContent.trim(),
      text: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container):not(:has(strong)):not(:has(em)):not(:empty)')?.textContent.trim(),
      subtext: row.querySelector(':scope > div:nth-of-type(2) p:not(.button-container) em')?.textContent.trim(),
      ctaLinks: row.querySelectorAll(':scope > div:nth-of-type(2) a'),
    };

    payload.actions.push(ctaObj);
  });

  return payload;
}

export default async function decorate(block) {
  const payload = constructPayload(block);
  decorateHeading(block, payload);
  await decorateCards(block, payload);
  buildCarousel('', block.querySelector('.gen-ai-cards-cards'));
  document.dispatchEvent(new CustomEvent('linkspopulated', { detail: block.querySelectorAll('.links-wrapper a') }));
}
