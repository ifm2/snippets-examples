'use strict';

const byId = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const valueOf = (id, fallback = '') => byId(id).value.trim() || fallback;
const examplePhotoURL = 'https://ifm2.github.io/snippets-examples/assets/alex-example.png';
let toastTimer;

function notify(message) {
  clearTimeout(toastTimer);
  byId('copy-status').textContent = message;
  toastTimer = setTimeout(() => { byId('copy-status').textContent = ''; }, 6500);
}

function imageURL(raw) {
  if (!raw) return '';
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('Use a full image address beginning with https://.');
  return url.href;
}

function updateProfile() {
  const name = valueOf('profile-name', 'Your name');
  const intro = valueOf('profile-role', 'Write a short introduction here.');
  const email = valueOf('profile-email');
  let photo = '';
  let error = '';
  try { photo = imageURL(valueOf('profile-image')); }
  catch { error = 'Use a full photo URL beginning with https://, or leave it blank for initials.'; }
  if (!byId('profile-email').validity.valid) error = 'Enter a valid contact email, or leave it blank to omit the contact link.';
  if (photo && !valueOf('profile-alt')) error = 'Add a brief photo description before copying.';
  byId('profile-error').textContent = error;
  document.querySelector('[data-copy="profile-code"]').disabled = Boolean(error);
  const initials = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase();
  const imageBlock = photo
    ? `<img style="display: block; width: 120px; max-width: 100%; height: auto;" src="${escapeHTML(photo)}" alt="${escapeHTML(valueOf('profile-alt'))}">`
    : `<div style="display: flex; align-items: center; justify-content: center; width: 120px; height: 120px; background: #e4ece1; color: #285b50; font-size: 32px;" aria-hidden="true">${escapeHTML(initials)}</div>`;
  const contact = email ? `\n    <p>Contact: <a href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a></p>` : '';
  const html = `<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; padding: 16px; margin-bottom: 24px; border: 1px solid #cccccc;">
  <div style="flex: 0 0 120px;">
    ${imageBlock}
  </div>
  <div style="flex: 1 1 300px; min-width: 0; overflow-wrap: anywhere;">
    <h3>${escapeHTML(name)}</h3>
    <p>${escapeHTML(intro)}</p>${contact}
  </div>
</div>`;
  byId('profile-preview').innerHTML = html;
  if (photo === examplePhotoURL) byId('profile-preview').querySelector('img').src = new URL('assets/alex-example.png', document.baseURI).href;
  byId('profile-code').textContent = html;
}

const emptyVideo = '<p>Enter a Panopto embed URL and select “Load my video” to preview it here, or select “Reset example” to return to the sample recording.</p>';
const exampleVideoURL = 'https://ox.cloud.panopto.eu/Panopto/Pages/Embed.aspx?id=2e6213de-5173-49c5-bc0d-b4f100ac1769';
let currentVideo = null;

function parsePanopto(raw) {
  // Accept an embed URL only. Never insert user-supplied iframe markup.
  const url = new URL(raw.replace(/&amp;/g, '&'));
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !/\/Panopto\/Pages\/Embed\.aspx$/i.test(url.pathname)) {
    throw new Error('Use the full HTTPS Embed.aspx URL from Panopto’s Share → Embed option.');
  }
  const id = url.searchParams.get('id');
  if (!id || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id)) {
    throw new Error('This embed URL needs a valid video ID after ?id=. Copy it again from Panopto.');
  }
  // Rebuild the URL so unrelated parameters or secrets are not carried into a public snippet.
  const embed = new URL('/Panopto/Pages/Embed.aspx', url.origin);
  embed.search = new URLSearchParams({id, autoplay:'false', offerviewer:'true', showtitle:'true', showbrand:'true', captions:'true', interactivity:'all'}).toString();
  const viewer = new URL('/Panopto/Pages/Viewer.aspx', url.origin);
  viewer.searchParams.set('id', id);
  return {embed: embed.href, viewer: viewer.href};
}

function videoSnippet(video) {
  const title = escapeHTML(valueOf('video-title', 'Welcome to the course'));
  const embed = new URL(video?.embed || 'https://YOUR_PANOPTO_HOST/Panopto/Pages/Embed.aspx?id=YOUR_VIDEO_ID');
  for (const key of ['autoplay', 'offerviewer', 'showtitle', 'showbrand', 'captions']) {
    embed.searchParams.set(key, String(byId(`video-${key}`).checked));
  }
  embed.searchParams.set('interactivity', byId('video-interactivity').checked ? 'all' : 'none');
  const fullscreen = byId('video-fullscreen').checked;
  const permissions = fullscreen ? ' allowfullscreen="allowfullscreen" allow="autoplay; fullscreen"' : ' allow="autoplay"';
  const viewer = video?.viewer || 'https://YOUR_PANOPTO_HOST/Panopto/Pages/Viewer.aspx?id=YOUR_VIDEO_ID';
  return `<h2>${title}</h2>
<div style="width: 100%; max-width: 960px; margin-bottom: 16px;">
  <iframe style="display: block; width: 100%; height: 620px; border: 1px solid #464646;" src="${escapeHTML(embed.href)}" title="${title} — Panopto video player" loading="lazy"${permissions} aria-label="${title} — Panopto video player"></iframe>
</div>
<p><a href="${escapeHTML(viewer)}">Open ${title} in Panopto</a> to use the full video viewer.</p>`;
}

function updateVideoCode() {
  byId('video-code').textContent = videoSnippet(currentVideo);
  byId('video-code-note').textContent = currentVideo ? 'HTML · ready for Canvas' : 'HTML · replace the example addresses before use';
  byId('video-feature-badge').textContent = byId('video-captions').checked && byId('video-interactivity').checked ? 'Contents + captions enabled' : 'Custom viewer settings';
  document.querySelectorAll('[data-option-value]').forEach((output) => {
    const id = output.dataset.optionValue;
    output.textContent = id === 'video-interactivity' ? (byId(id).checked ? 'all' : 'none') : String(byId(id).checked);
  });
}

function renderVideo(isExample = false) {
  updateVideoCode();
  byId('video-preview').innerHTML = videoSnippet(currentVideo);
  byId('video-preview').classList.add('has-video');
  byId('video-preview-label').textContent = isExample ? 'LIVE EXAMPLE' : 'YOUR LIVE EMBED';
  const contentsHelp = byId('video-interactivity').checked ? 'Open the contents menu to explore its chapters.' : 'Contents and interactivity are disabled in this embed.';
  byId('video-caption').textContent = `${isExample ? 'Example recording' : 'Your recording'} in the real Panopto viewer. ${contentsHelp} If the embed cannot load, use the full viewer link and check sharing permissions. Captions and contents depend on the recording.`;
  document.querySelector('[data-copy="video-code"]').disabled = false;
}

function resetVideo() {
  byId('video-form').reset();
  byId('video-error').textContent = '';
  byId('video-options-status').textContent = '';
  byId('video-url').value = exampleVideoURL;
  currentVideo = parsePanopto(exampleVideoURL);
  renderVideo(true);
}

byId('profile-form').addEventListener('submit', (event) => event.preventDefault());
byId('profile-form').addEventListener('input', updateProfile);
document.querySelectorAll('[data-width]').forEach((button) => {
  button.addEventListener('click', () => {
    byId('profile-preview').classList.toggle('narrow', button.dataset.width === 'narrow');
    document.querySelectorAll('[data-width]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
  });
});

byId('video-title').addEventListener('input', () => {
  updateVideoCode();
  if (currentVideo) {
    byId('video-preview').querySelector('h2').textContent = valueOf('video-title', 'Welcome to the course');
    const frame = byId('video-preview').querySelector('iframe');
    const label = `${valueOf('video-title', 'Welcome to the course')} — Panopto video player`;
    frame.title = label;
    frame.setAttribute('aria-label', label);
    byId('video-preview').querySelector('a').textContent = `Open ${valueOf('video-title', 'Welcome to the course')} in Panopto`;
  }
});

byId('video-url').addEventListener('input', () => {
  // Invalidate the previous URL immediately so the code cannot silently describe a different video.
  currentVideo = null;
  byId('video-preview').innerHTML = emptyVideo;
  byId('video-preview').classList.remove('has-video');
  byId('video-preview-label').textContent = 'PREVIEW NOT LOADED';
  byId('video-caption').textContent = 'Select “Load my video” to apply this address to the preview and snippet.';
  byId('video-error').textContent = '';
  document.querySelector('[data-copy="video-code"]').disabled = Boolean(valueOf('video-url'));
  updateVideoCode();
});

byId('video-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    if (!valueOf('video-url')) throw new Error('Paste your Panopto embed URL first.');
    currentVideo = parsePanopto(valueOf('video-url'));
    byId('video-error').textContent = '';
    renderVideo();
    notify('Video applied. Check the viewer and copy your HTML.');
  } catch (error) {
    byId('video-error').textContent = error.message === 'Invalid URL' ? 'Enter a full HTTPS embed URL from Panopto.' : error.message;
    byId('video-url').focus();
  }
});

byId('reset-video').addEventListener('click', resetVideo);

document.querySelectorAll('[data-video-option]').forEach((option) => {
  option.addEventListener('change', () => {
    if (currentVideo) renderVideo(currentVideo.viewer === parsePanopto(exampleVideoURL).viewer);
    else updateVideoCode();
    byId('video-options-status').textContent = currentVideo ? 'Settings applied to the preview and HTML.' : 'Settings applied to the HTML. Load a video to preview them.';
  });
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = byId(button.dataset.copy);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code.textContent);
      notify(button.dataset.copy === 'video-code' && !currentVideo ? 'Template copied. Replace the example host and video ID before pasting into Canvas.' : 'HTML copied. Paste it into Canvas’s HTML view.');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      code.parentElement.focus();
      notify('Code selected. Press Ctrl+C on Windows or Command+C on Mac to copy.');
    }
  });
});

updateProfile();
resetVideo();

// Each child is a sibling disclosure nested inside the main disclosure.
let nextAccordionId = 1;
let accordionChildren = [];
let hiddenAccordionChildren = [];
const accordionSamples = [
  { title: 'Before the session', body: 'Read the introduction and make a note of one question you would like to discuss.' },
  { title: 'Further reading', body: 'Review the worked examples after the session. Try applying one idea to a question of your own.' }
];

function accordionParagraphs(text, indent) {
  return text.trim().split(/\n\s*\n/).filter(Boolean).map((paragraph) =>
    `${indent}<p>${escapeHTML(paragraph.trim()).replace(/\n/g, '<br>')}</p>`
  ).join('\n');
}

const accordionStyleAreas = [
  { key: 'heading', label: 'Main heading', background: '#d0e7f2', padding: '0.8' },
  { key: 'content', label: 'Main content', background: '#efefef', padding: '0.5' },
  { key: 'sub', label: 'Sub-accordions', background: '#ffffff', padding: '0.5' }
];

function renderAccordionStyleControls() {
  byId('accordion-style-controls').innerHTML = accordionStyleAreas.map((area) => `
    <fieldset class="accordion-style-area"><legend>${area.label}</legend>
      <label for="acc-${area.key}-bg">Background colour</label>
      <div class="colour-inputs"><input type="color" id="acc-${area.key}-bg" value="${area.background}" data-colour-picker="acc-${area.key}-bg-hex" aria-label="${area.label} background colour picker"><input type="text" id="acc-${area.key}-bg-hex" value="${area.background}" data-colour-hex="acc-${area.key}-bg" aria-label="${area.label} background hex colour" maxlength="7" spellcheck="false"></div>
      <label for="acc-${area.key}-text">Text colour</label>
      <div class="colour-inputs"><input type="color" id="acc-${area.key}-text" value="#203c36" data-colour-picker="acc-${area.key}-text-hex" data-area="${area.key}" aria-label="${area.label} text colour picker"><input type="text" id="acc-${area.key}-text-hex" value="#203c36" data-colour-hex="acc-${area.key}-text" data-area="${area.key}" aria-label="${area.label} text hex colour" maxlength="7" spellcheck="false"></div>
      <label class="option-row"><input type="checkbox" id="acc-${area.key}-inherit" checked><span>Inherit surrounding text colour<small>University default. Choosing a text colour switches this off.</small></span></label>
      <label for="acc-${area.key}-padding">Padding <output id="acc-${area.key}-padding-value" for="acc-${area.key}-padding">${area.padding}em</output></label>
      <input type="range" id="acc-${area.key}-padding" value="${area.padding}" min="0" max="3" step="0.1" aria-label="${area.label} padding in em">
      <div class="colour-sample" id="acc-${area.key}-sample">${area.label} — sample text</div>
      <p class="contrast-result" id="acc-${area.key}-contrast"></p>
    </fieldset>`).join('');
}

function accordionAreaStyle(key) {
  return {
    background: byId(`acc-${key}-bg`).value,
    text: byId(`acc-${key}-inherit`).checked ? '' : byId(`acc-${key}-text`).value,
    padding: `${Number(byId(`acc-${key}-padding`).value)}em`
  };
}

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function computedHex(element) {
  const channels = getComputedStyle(element).color.match(/[\d.]+/g).slice(0, 3);
  return '#' + channels.map((channel) => Math.round(Number(channel)).toString(16).padStart(2, '0')).join('');
}

function updateAccordionContrast() {
  const root = byId('accordion-preview').querySelector('details');
  const elements = { heading: root.querySelector('summary'), content: root.querySelector('div'), sub: root.querySelector('details') || root.querySelector('div') };
  const aaFailures = [], aaaFailures = [];
  accordionStyleAreas.forEach((area) => {
    const style = accordionAreaStyle(area.key);
    const text = style.text || computedHex(elements[area.key]);
    if (!style.text) {
      byId(`acc-${area.key}-text`).value = text;
      const hexField = byId(`acc-${area.key}-text-hex`);
      if (hexField.getAttribute('aria-invalid') !== 'true') hexField.value = text;
    }
    const ratio = contrastRatio(text, style.background);
    const aa = ratio >= 4.5, aaa = ratio >= 7;
    const sample = byId(`acc-${area.key}-sample`);
    sample.style.backgroundColor = style.background;
    sample.style.color = text;
    const result = byId(`acc-${area.key}-contrast`);
    result.textContent = `${ratio.toFixed(3)}:1 · AA ${aa ? 'PASS' : 'FAIL'} (4.5:1) · AAA ${aaa ? 'PASS' : 'FAIL'} (7:1)`;
    result.classList.toggle('contrast-fail', !aa);
    result.classList.toggle('contrast-aaa', aa && !aaa);
    if (!aa) aaFailures.push(area.label);
    if (!aaa) aaaFailures.push(area.label);
    byId(`acc-${area.key}-padding-value`).textContent = style.padding;
  });
  const summary = byId('accordion-contrast-summary');
  summary.textContent = aaFailures.length ? `Warning: ${aaFailures.join(', ')} ${aaFailures.length === 1 ? 'has' : 'have'} text contrast below WCAG AA (4.5:1), and also below AAA (7:1). Choose a stronger text/background contrast. Copying remains available.` : aaaFailures.length ? `AAA contrast warning: ${aaaFailures.join(', ')} ${aaaFailures.length === 1 ? 'does' : 'do'} not meet AAA (7:1). All three colour pairs still meet AA text contrast (4.5:1). Copying remains available.` : 'All three colour pairs meet AA and AAA text contrast for normal-sized text in this preview.';
  summary.classList.toggle('contrast-fail', aaFailures.length > 0);
  summary.classList.toggle('contrast-aaa', aaFailures.length === 0 && aaaFailures.length > 0);
}

function updateAccordion(preserveOpen = false) {
  const expanded = preserveOpen ? Array.from(byId('accordion-preview').querySelectorAll('details'), (item) => item.open) : [];
  const title = escapeHTML(valueOf('accordion-heading', 'Section heading'));
  const mainOpen = byId('accordion-open').checked ? ' open' : '';
  const heading = accordionAreaStyle('heading'), content = accordionAreaStyle('content'), sub = accordionAreaStyle('sub');
  const textStyle = (area) => area.text ? ` color: ${area.text};` : '';
  const paragraphs = accordionParagraphs(byId('accordion-body').value, '    ');
  const children = accordionChildren.map((child) => {
    const body = accordionParagraphs(child.body, '      ');
    return `    <details style="background-color: ${sub.background};${textStyle(sub)} padding: ${sub.padding};"${child.open ? ' open' : ''}>
      <summary><strong>${escapeHTML(child.title.trim() || 'Sub-accordion heading')}</strong></summary>
${body}
    </details>`;
  }).join('\n');
  const html = `<details class="fossa fossa-r"${mainOpen}>
  <summary style="background-color: ${heading.background};${textStyle(heading)} padding: ${heading.padding}; cursor: pointer;"><strong>${title}</strong></summary>
  <div style="background-color: ${content.background};${textStyle(content)} padding: ${content.padding};">
${[paragraphs, children].filter(Boolean).join('\n')}
  </div>
</details>`;
  byId('accordion-code').textContent = html;
  byId('accordion-preview').innerHTML = html;
  if (preserveOpen) byId('accordion-preview').querySelectorAll('details').forEach((item, index) => { item.open = expanded[index] || false; });
  byId('accordion-count').textContent = `${accordionChildren.length} sub-accordion${accordionChildren.length === 1 ? '' : 's'}`;
  updateAccordionContrast();
}

function renderAccordionEditors() {
  document.querySelectorAll('[data-accordion-preset]').forEach((button) => {
    const count = Number(button.dataset.accordionPreset);
    button.setAttribute('aria-pressed', String(count === 2 ? accordionChildren.length >= 2 : accordionChildren.length === count));
  });
  byId('accordion-children').innerHTML = accordionChildren.length ? accordionChildren.map((child, index) => `
    <fieldset class="sub-accordion-editor" data-child-id="${child.id}">
      <legend>Sub-accordion ${index + 1}</legend>
      <label for="sub-heading-${child.id}">Heading</label>
      <input id="sub-heading-${child.id}" data-child-field="title" value="${escapeHTML(child.title)}" maxlength="180">
      <label for="sub-body-${child.id}">Content</label>
      <textarea id="sub-body-${child.id}" data-child-field="body" rows="3" maxlength="6000">${escapeHTML(child.body)}</textarea>
      <label class="option-row"><input type="checkbox" data-child-field="open"${child.open ? ' checked' : ''}><span>Start this sub-accordion expanded</span></label>
      <button type="button" class="text-button remove-sub" data-remove-child="${child.id}" aria-label="Remove sub-accordion ${index + 1}">Remove sub-accordion</button>
    </fieldset>`).join('') : '<p class="empty-sub-accordions">No sub-accordions. Add one below, or copy this simple accordion as it is.</p>';
  updateAccordion();
}

function addAccordionChild(sample) {
  accordionChildren.push({ id: nextAccordionId++, title: sample?.title || 'Another resource', body: sample?.body || 'Add the information students need for this section.', open: sample?.open ?? false });
}

byId('accordion-form').addEventListener('submit', (event) => event.preventDefault());
byId('accordion-form').addEventListener('input', (event) => {
  const input = event.target;
  if (input.dataset.colourHex) {
    const valid = /^#[a-f\d]{6}$/i.test(input.value);
    input.setAttribute('aria-invalid', String(!valid));
    if (valid) {
      byId(input.dataset.colourHex).value = input.value;
      if (input.dataset.area) byId(`acc-${input.dataset.area}-inherit`).checked = false;
    }
  }
  if (input.dataset.colourPicker) {
    const hexField = byId(input.dataset.colourPicker);
    hexField.value = input.value;
    hexField.setAttribute('aria-invalid', 'false');
    if (input.dataset.area) byId(`acc-${input.dataset.area}-inherit`).checked = false;
  }
  byId('accordion-style-error').textContent = byId('accordion-style-controls').querySelector('[aria-invalid="true"]') ? 'Enter a six-digit hex colour such as #d0e7f2. The preview and HTML keep the last valid colour while you edit.' : '';
  const field = event.target.dataset.childField;
  if (field) {
    const id = Number(event.target.closest('[data-child-id]').dataset.childId);
    const child = accordionChildren.find((item) => item.id === id);
    child[field] = field === 'open' ? event.target.checked : event.target.value;
  }
  updateAccordion(Boolean(input.closest('#accordion-style-controls')));
});

byId('add-sub-accordion').addEventListener('click', () => {
  addAccordionChild();
  renderAccordionEditors();
  byId(`sub-heading-${accordionChildren.at(-1).id}`).focus();
  byId('accordion-status').textContent = `Sub-accordion added. ${accordionChildren.length} in total.`;
});

byId('accordion-children').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-child]');
  if (!button) return;
  accordionChildren = accordionChildren.filter((item) => item.id !== Number(button.dataset.removeChild));
  renderAccordionEditors();
  byId('add-sub-accordion').focus();
  byId('accordion-status').textContent = `Sub-accordion removed. ${accordionChildren.length} remaining.`;
});

document.querySelectorAll('[data-accordion-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const count = Number(button.dataset.accordionPreset);
    if (accordionChildren.length > count) {
      hiddenAccordionChildren = accordionChildren.splice(count).concat(hiddenAccordionChildren);
    }
    while (accordionChildren.length < count) {
      if (hiddenAccordionChildren.length) accordionChildren.push(hiddenAccordionChildren.shift());
      else addAccordionChild(accordionSamples[accordionChildren.length]);
    }
    renderAccordionEditors();
    byId('accordion-status').textContent = `${accordionChildren.length} sub-accordion${accordionChildren.length === 1 ? '' : 's'}. Existing text is kept; sections hidden by these buttons can be restored by choosing a larger structure.`;
  });
});

byId('reset-accordion-style').addEventListener('click', () => {
  renderAccordionStyleControls();
  byId('accordion-style-error').textContent = '';
  updateAccordion(true);
  byId('accordion-status').textContent = 'University spacing and colours restored. Your content is unchanged.';
});

renderAccordionStyleControls();
addAccordionChild({ ...accordionSamples[0], open: true });
renderAccordionEditors();
byId('accordion-advanced').open = false;

// Callouts retain the University box styles and use a numbered preparation list.
const calloutPalettes = {
  blue: { bg: '#e5f2f8', text: '#00507e', border: '#00507e' },
  red: { bg: '#fce8e7', text: '#94040b', border: '#94040b' }
};
const calloutDefaults = { ...calloutPalettes.blue, padding: '12', 'border-width': '4', 'heading-gap': '8' };
function updateCallout() {
  const showHeading = byId('callout-show-heading').checked;
  byId('callout-heading-fields').hidden = !showHeading;
  const background = byId('callout-bg').value;
  const text = byId('callout-text').value;
  const border = byId('callout-border').value;
  document.querySelectorAll('[data-callout-preset]').forEach(button => {
    const palette = calloutPalettes[button.dataset.calloutPreset];
    button.setAttribute('aria-pressed', String(palette.bg === background && palette.text === text && palette.border === border));
  });
  const padding = Number(byId('callout-padding').value);
  const borderWidth = Number(byId('callout-border-width').value);
  const headingGap = Number(byId('callout-heading-gap').value);
  const heading = showHeading ? `\n  <h3 style="margin: 0 0 ${headingGap}px; color: inherit;">${escapeHTML(valueOf('callout-heading', 'Reminder'))}</h3>` : '';
  const items = byId('callout-body').value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const bullets = items.map(line => `    <li><span style="font-size: 12pt;">${escapeHTML(line)}</span></li>`).join('\n');
  const html = `<div style="background: ${background}; color: ${text}; padding: ${padding}px; border-left: ${borderWidth}px solid ${border};">${heading}
  <ol>
${bullets}
  </ol>
</div>`;
  byId('callout-preview').innerHTML = html;
  byId('callout-code').textContent = html;
  ['padding', 'border-width', 'heading-gap'].forEach(key => {
    byId(`callout-${key}-value`).textContent = `${Number(byId(`callout-${key}`).value)}px`;
  });
  const ratio = contrastRatio(text, background);
  const aa = ratio >= 4.5;
  const aaa = ratio >= 7;
  const sample = byId('callout-colour-sample');
  sample.style.backgroundColor = background;
  sample.style.color = text;
  const result = byId('callout-contrast');
  result.textContent = `${ratio.toFixed(3)}:1 · AA ${aa ? 'PASS' : 'FAIL'} (4.5:1) · AAA ${aaa ? 'PASS' : 'FAIL'} (7:1)`;
  result.classList.toggle('contrast-fail', !aa);
  result.classList.toggle('contrast-aaa', aa && !aaa);
  const summary = byId('callout-contrast-summary');
  summary.textContent = !aa ? 'Warning: text contrast is below AA (4.5:1) and AAA (7:1). Choose a stronger text/background contrast. Copying remains available.' : !aaa ? 'Text contrast meets AA (4.5:1), but falls below AAA (7:1). Copying remains available.' : 'Text contrast meets AA and AAA for normal-sized text in this preview.';
  summary.classList.toggle('contrast-fail', !aa);
  summary.classList.toggle('contrast-aaa', aa && !aaa);
}
byId('callout-form').addEventListener('submit', event => event.preventDefault());
byId('callout-form').addEventListener('input', event => {
  const input = event.target;
  if (input.dataset.calloutHex) {
    const valid = /^#[a-f\d]{6}$/i.test(input.value);
    input.setAttribute('aria-invalid', String(!valid));
    if (valid) byId(input.dataset.calloutHex).value = input.value;
  }
  if (input.dataset.calloutPicker) {
    const field = byId(input.dataset.calloutPicker);
    field.value = input.value;
    field.setAttribute('aria-invalid', 'false');
  }
  byId('callout-error').textContent = byId('callout-form').querySelector('[aria-invalid="true"]') ? 'Enter a six-digit hex colour such as #fce8e7. The preview and HTML keep the last valid colour while you edit.' : '';
  updateCallout();
});
document.querySelectorAll('[data-callout-preset]').forEach(button => {
  button.addEventListener('click', () => {
    Object.entries(calloutPalettes[button.dataset.calloutPreset]).forEach(([key, value]) => {
      byId(`callout-${key}`).value = value;
      const hex = byId(`callout-${key}-hex`);
      hex.value = value;
      hex.setAttribute('aria-invalid', 'false');
    });
    byId('callout-error').textContent = '';
    updateCallout();
  });
});
byId('reset-callout-style').addEventListener('click', () => {
  Object.entries(calloutDefaults).forEach(([key, value]) => {
    byId(`callout-${key}`).value = value;
    const hex = byId(`callout-${key}-hex`);
    if (hex) { hex.value = value; hex.setAttribute('aria-invalid', 'false'); }
  });
  byId('callout-error').textContent = '';
  updateCallout();
});
updateCallout();
byId('callout-advanced').open = false;
