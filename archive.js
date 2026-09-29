// Leave all links and project notes usable without JavaScript.
document.querySelectorAll('.art-no-picture span').forEach(label => {
  label.replaceChildren(document.createTextNode('ESCAPE'), document.createElement('br'));
  const subtitle = document.createElement('small');
  subtitle.textContent = 'ORIGINAL GAME';
  label.append(subtitle);
});

// Reflect playback through the archive in the decorative VHS time counter.
const counter = document.querySelector('.transport span:nth-child(2)');
let pending = false;
function updateCounter() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const seconds = Math.max(1, Math.round((max > 0 ? window.scrollY / max : 0) * 120));
  if (counter) counter.textContent = `SP  00:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  pending = false;
}
window.addEventListener('scroll', () => {
  if (!pending) { pending = true; requestAnimationFrame(updateCounter); }
}, { passive: true });
updateCounter();

// Build both shelves from the original content. The static archive remains the
// fallback when scripting is unavailable; project URLs have one source of truth.
function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

let detailTimer;
let detailDialog;
function openProjectDetail(item, isDisc, trigger, onClose) {
  if (!detailDialog) {
    detailDialog = element('dialog', 'project-detail');
    document.body.append(detailDialog);
  }
  const dialog = detailDialog;
  dialog.replaceChildren();
  dialog.setAttribute('aria-labelledby', 'detail-title');
  const sheet = element('div', 'detail-sheet');
  const copy = element('section', 'detail-copy');
  const header = element('div', 'detail-header');
  header.append(element('span', '', `${isDisc ? 'DISC' : 'TAPE'} ${String(item.index + 1).padStart(2, '0')} / ESCAPE®`));
  const close = element('button', 'detail-close', '关闭 ×');
  close.type = 'button';
  header.append(close);
  const title = element('h2', '', item.title);
  title.id = 'detail-title';
  copy.append(header, title, element('p', 'detail-description', item.description));
  const link = element('a', 'detail-link', item.action);
  link.href = item.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  copy.append(link);
  const media = element('section', 'detail-media');
  media.setAttribute('aria-label', '项目图片与设计说明');
  if (item.image) {
    const match = item.image.match(/url\(["']?(.*?)["']?\)/);
    if (match) {
      const img = element('img', 'detail-image');
      img.src = match[1];
      img.alt = `${item.title} 项目封面`;
      media.append(img);
    }
    if (item.title === 'SAY GOODBYE TO GOODLUCK') {
      const img = element('img', 'detail-image');
      img.src = 'assets/say-goodbye-02.png';
      img.alt = `${item.title} 第二张项目海报`;
      media.append(img);
    }
  } else {
    const cover = element('div', `detail-placeholder${isDisc ? ' detail-placeholder--disc' : ''}`);
    cover.append(element('span', '', isDisc ? 'DVD / DIGITAL TOOLS' : 'VHS / GAME ARCHIVE'));
    if (isDisc) {
      const disc = element('div', 'disc detail-disc');
      disc.setAttribute('aria-hidden', 'true');
      cover.append(disc);
    }
    cover.append(element('h3', '', item.title), element('p', '', isDisc ? '应用与工具' : '项目封面待补充'));
    media.append(cover);
  }
  if (item.story) {
    const notes = item.story.querySelector('.story-content').cloneNode(true);
    notes.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    notes.classList.add('detail-notes');
    media.append(notes);
  }
  sheet.append(copy, media);
  dialog.append(sheet);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const savedOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  dialog.showModal();
  dialog.scrollTop = 0;
  close.focus({ preventScroll: true });
  const entry = sheet.animate([{ transform:'translateX(100%)' }, { transform:'translateX(0)' }], { duration:reduced ? 0 : 650, easing:'cubic-bezier(.22,.75,.25,1)' });
  let closing = false;
  async function dismiss() {
    if (closing) return;
    closing = true;
    await entry.finished.catch(() => {});
    await sheet.animate([{ transform:'translateX(0)' }, { transform:'translateX(100%)' }], { duration:reduced ? 0 : 360, easing:'cubic-bezier(.4,0,.8,.3)' }).finished.catch(() => {});
    dialog.close();
    document.documentElement.style.overflow = savedOverflow;
    onClose();
    trigger.focus({ preventScroll:true });
  }
  close.onclick = dismiss;
  dialog.oncancel = event => { event.preventDefault(); dismiss(); };
  dialog.onclick = event => { if (event.target === dialog) dismiss(); };
}

function createShelf(section, sources, kind) {
  const isDisc = kind === 'disc';
  const items = sources.map((source, index) => {
    const link = isDisc ? source : source.querySelector(':scope > a');
    const art = source.querySelector('.art');
    const story = source.querySelector('.project-story');
    const description = source.querySelector('.story-copy > p');
    return {
      title: source.querySelector('h2').textContent,
      href: link.href,
      image: art && !art.classList.contains('art-no-picture') ? getComputedStyle(art).backgroundImage : '',
      description: description ? description.textContent : isDisc
        ? (index === 0 ? '记录 Android 手机屏幕的最近 30 秒。' : '在 Android 设备上，使用 LMO 数据集进行物体六自由度姿态估计。')
        : (link.hostname === 'escaep.itch.io' ? '这款游戏收录于我的个人作品档案。点击下方链接，在 itch.io 查看游戏详情并游玩。' : '这款游戏收录于我的个人作品档案。点击下方链接，通过百度网盘获取游戏。'),
      story, index,
      action: isDisc ? '查看 GitHub 项目 ↗' : link.hostname === 'escaep.itch.io' ? '查看并游玩 ↗' : '下载游戏 ↗'
    };
  });
  const shelf = element('div', `media-library media-library--${kind}`);
  const collection = element('div', 'shelf-collection');
  const toolbar = element('div', 'shelf-toolbar');
  toolbar.append(element('span', '', isDisc ? 'SIDE B / DVD COLLECTION' : 'SIDE A / VHS COLLECTION'));
  const controls = element('div', 'shelf-controls');
  const viewport = element('div', 'shelf-viewport');
  const row = element('div', 'shelf-row');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', isDisc ? '选择光盘' : '选择录像带');
  const panel = element('div', 'shelf-info');
  panel.id = `${section.id}-selection`;
  panel.setAttribute('aria-live', 'polite');
  panel.setAttribute('aria-atomic', 'true');
  let selected = -1;
  const buttons = [];
  function liftWave(center = -1) {
    buttons.forEach((button, index) => {
      const distance = Math.abs(index - center);
      const lift = center < 0 ? 0 : [32, 17, 6][distance] || 0;
      button.style.setProperty('--shelf-lift', `${-lift}px`);
    });
  }
  row.addEventListener('pointerleave', () => liftWave());
  row.addEventListener('focusout', event => {
    if (!row.contains(event.relatedTarget)) liftWave();
  });
  function showInfo(item) {
    panel.replaceChildren();
    panel.append(element('p', 'shelf-kicker', item ? `${isDisc ? 'DISC' : 'TAPE'} ${String(item.index + 1).padStart(2, '0')} / ${isDisc ? 'DIGITAL TOOL' : 'ORIGINAL GAME'}` : 'PICK SOMETHING TO PLAY'));
    panel.append(element('h3', '', item ? item.title : isDisc ? '取出一张光盘。' : '取出一卷录像带。'));
    panel.append(element('p', 'shelf-description', item ? item.description : '点击侧面的名字，让封面转到面前，再打开项目详情。关闭详情，即可回到架子。'));
    if (!item) return;
    const action = element('a', 'shelf-action', item.action);
    action.href = item.href;
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    panel.append(action);
    if (item.story) {
      const notes = item.story.cloneNode(true);
      notes.removeAttribute('open');
      notes.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      panel.append(notes);
    }
  }
  function select(index) {
    clearTimeout(detailTimer);
    selected = selected === index ? -1 : index;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-selected', i === selected);
      button.setAttribute('aria-pressed', String(i === selected));
    });
    showInfo(items[selected]);
    if (selected >= 0) {
      const current = selected;
      detailTimer = setTimeout(() => {
        openProjectDetail(items[current], isDisc, buttons[current], () => {
          selected = -1;
          buttons.forEach(button => {
            button.classList.remove('is-selected');
            button.setAttribute('aria-pressed', 'false');
          });
          showInfo();
          liftWave();
        });
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 740);
    }
    if (selected >= 0 && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => keepVisible(buttons[selected], 'instant'));
    }
  }
  function keepVisible(button, behavior) {
    if (!button) return;
    const right = button.offsetLeft + button.offsetWidth;
    if (right > viewport.scrollLeft + viewport.clientWidth) viewport.scrollTo({ left: right - viewport.clientWidth + 24, behavior });
    else if (button.offsetLeft < viewport.scrollLeft) viewport.scrollTo({ left: Math.max(0, button.offsetLeft - 24), behavior });
  }
  items.forEach(item => {
    const button = element('button', 'shelf-item');
    button.type = 'button';
    button.style.setProperty('--case-color', ['#d8e2a5', '#dbb99b', '#aebecd', '#bbc4ac', '#d1b6bf'][item.index % 5]);
    button.setAttribute('aria-label', `查看${isDisc ? '光盘' : '录像带'}：${item.title}`);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-controls', panel.id);
    const box = element('span', 'shelf-case');
    box.setAttribute('aria-hidden', 'true');
    const spine = element('span', 'case-spine');
    spine.append(element('small', '', String(item.index + 1).padStart(2, '0')), element('strong', '', item.title), element('small', '', isDisc ? 'DVD' : 'VHS'));
    const front = element('span', `case-front${item.image ? ' has-cover' : ''}`);
    front.append(element('small', 'case-brand', 'ESCAPE® / PERSONAL ARCHIVE'));
    if (item.image) {
      const picture = element('span', 'case-picture');
      picture.style.backgroundImage = item.image;
      front.append(picture);
    }
    if (isDisc) {
      const disc = element('span', 'shelf-disc');
      disc.append(element('span', '', item.title));
      front.append(disc);
    } else if (!item.image) {
      front.append(element('strong', 'case-placeholder', item.title));
      front.append(element('small', 'case-unavailable', '游戏封面待补充'));
    }
    front.append(element('span', 'case-caption', item.title));
    box.append(front, spine);
    ['back', 'left', 'top', 'bottom'].forEach(face => box.append(element('span', `case-solid case-${face}`)));
    button.append(box);
    button.addEventListener('click', () => select(item.index));
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') liftWave(item.index);
    });
    button.addEventListener('focus', () => liftWave(item.index));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (item.index + 1) % items.length;
      if (event.key === 'ArrowLeft') next = (item.index - 1 + items.length) % items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = items.length - 1;
      if (event.key === 'Escape') { event.preventDefault(); if (selected >= 0) select(selected); }
      if (next !== undefined) { event.preventDefault(); buttons[next].focus(); }
    });
    // Measure after the width transition, so edge items remain fully visible.
    button.addEventListener('transitionend', event => {
      if (event.propertyName !== 'width' || !button.classList.contains('is-selected')) return;
      keepVisible(button, 'smooth');
    });
    buttons.push(button);
    row.append(button);
  });
  ['←', '→'].forEach((label, index) => {
    const button = element('button', '', label);
    button.type = 'button';
    button.setAttribute('aria-label', index ? '向右浏览收藏' : '向左浏览收藏');
    button.addEventListener('click', () => viewport.scrollBy({ left: (index ? 1 : -1) * viewport.clientWidth * .65, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    controls.append(button);
  });
  toolbar.append(controls);
  viewport.append(row);
  collection.append(toolbar, viewport, element('p', 'shelf-hint', '点击取出并查看详情 · 左右滑动浏览'));
  shelf.append(collection, panel);
  showInfo();
  section.append(shelf);
  sources.forEach(source => { source.hidden = true; });
  const grid = section.querySelector('.app-grid');
  if (grid) grid.hidden = true;
  section.classList.add('has-shelf');
}
createShelf(document.querySelector('#work'), [...document.querySelectorAll('.project')], 'tape');
createShelf(document.querySelector('#apps'), [...document.querySelectorAll('.app-card')], 'disc');

// Keep the viewer at the viewport's center on both axes. Faces nearest the viewer
// stay at z=0, so changing the exposed face does not change its apparent size.
const shelfScenes = [...document.querySelectorAll('.shelf-row')];
let viewFrame = 0;
function updateShelfView() {
  viewFrame = 0;
  const eyeX = window.innerWidth / 2;
  const eyeY = window.innerHeight / 2;
  const origins = shelfScenes.map(item => {
    const rect = item.getBoundingClientRect();
    return { x: eyeX - rect.left, y: eyeY - rect.top };
  });
  shelfScenes.forEach((item, index) => {
    item.style.setProperty('--view-x', `${origins[index].x.toFixed(1)}px`);
    item.style.setProperty('--view-y', `${origins[index].y.toFixed(1)}px`);
  });
}
function scheduleShelfView() {
  if (!viewFrame) viewFrame = requestAnimationFrame(updateShelfView);
}
// Capture shelf scrolling as well as page scrolling.
window.addEventListener('scroll', scheduleShelfView, { passive: true, capture: true });
window.addEventListener('resize', scheduleShelfView, { passive: true });
const shelfViewObserver = new ResizeObserver(scheduleShelfView);
shelfViewObserver.observe(document.body);
// Opening a case moves its neighbors throughout the width transition.
shelfScenes.forEach(item => shelfViewObserver.observe(item));
updateShelfView();
