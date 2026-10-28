'use strict';

const byId = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const valueOf = (id, fallback = '') => byId(id).value.trim() || fallback;
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
