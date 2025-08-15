/* ...existing code... */
import { getRoomsFeed, getProject } from './api.js';
import { el, avatarUrl, siteLink, projectLink, downloadJSON, includesInsensitive } from './utils.js';

const dom = {
  roomsGrid: document.getElementById('roomsGrid'),
  emptyState: document.getElementById('emptyState'),
  refreshBtn: document.getElementById('refreshBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  filterInput: document.getElementById('filterInput'),
  limitSelect: document.getElementById('limitSelect'),
  autoRefreshToggle: document.getElementById('autoRefreshToggle'),
  autoRefreshInterval: document.getElementById('autoRefreshInterval'),
  projectIdInput: document.getElementById('projectIdInput'),
  checkProjectBtn: document.getElementById('checkProjectBtn'),
  projectResult: document.getElementById('projectResult'),
};

let latestRooms = [];
let autoTimer = null;

async function loadRooms() {
  const limit = Number(dom.limitSelect.value || 24);
  dom.refreshBtn.disabled = true;
  try {
    const feed = await getRoomsFeed({ limit });
    latestRooms = feed;
    renderRooms();
  } catch (e) {
    console.error(e);
    latestRooms = [];
    renderRooms();
  } finally {
    dom.refreshBtn.disabled = false;
  }
}

function renderRooms() {
  const q = dom.filterInput.value.trim();
  dom.roomsGrid.innerHTML = '';

  let items = latestRooms;
  if (q) {
    items = items.filter(({ project }) => {
      const title = project?.title || '';
      const username = project?.created_by?.username || '';
      return includesInsensitive(title, q) || includesInsensitive(username, q);
    });
  }

  if (!items.length) {
    dom.emptyState.classList.remove('hidden');
    return;
  }
  dom.emptyState.classList.add('hidden');

  for (const row of items) {
    const { project, project_revision, room } = row;
    const username = project?.created_by?.username || 'unknown';
    const avatar = avatarUrl(username);
    const title = project?.title || '(untitled project)';
    const players = room?.count ?? project_revision?.stats?.multiplayer_count ?? 0;
    const links = [];

    if (project?.id) links.push(el('a', { class: 'link', href: projectLink(project.id), target: '_blank', rel: 'noopener', text: 'Project' }));
    if (project_revision?.site_id) links.push(el('a', { class: 'link', href: siteLink(project_revision.site_id), target: '_blank', rel: 'noopener', text: 'Open Site' }));

    const card = el('div', { class: 'card' }, [
      el('div', { class: 'card-header' }, [
        el('img', { class: 'avatar', src: avatar, alt: `${username} avatar` }),
        el('div', {}, [
          el('h3', { class: 'title', text: title }),
          el('div', { class: 'meta' }, [
            el('a', { class: 'link', href: `https://websim.com/@${username}`, target: '_blank', rel: 'noopener', text: `@${username}` })
          ])
        ])
      ]),
      el('div', { class: 'badges' }, [
        el('span', { class: 'badge count', title: 'Current players in lobby', text: `${players} online` }),
        el('span', { class: 'badge', text: `Room: ${room?.room || 'unknown'}` }),
      ]),
      el('div', { class: 'links' }, links),
    ]);

    dom.roomsGrid.appendChild(card);
  }
}

function setAutoRefresh(enabled) {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  if (enabled) {
    const sec = Math.max(5, Number(dom.autoRefreshInterval.value || 15));
    autoTimer = setInterval(loadRooms, sec * 1000);
  }
}

async function checkSpecificProject() {
  const id = dom.projectIdInput.value.trim();
  if (!id) return;
  dom.checkProjectBtn.disabled = true;
  dom.projectResult.textContent = 'Loading...';
  try {
    const body = await getProject(id);
    const project = body.project;
    const rev = body.project_revision;
    const username = project?.created_by?.username || 'unknown';
    const count = rev?.stats?.multiplayer_count ?? 0;

    const card = el('div', { class: 'project-card' }, [
      el('div', { class: 'card-header' }, [
        el('img', { class: 'avatar', src: avatarUrl(username), alt: `${username} avatar` }),
        el('div', {}, [
          el('h3', { class: 'title', text: project?.title || '(untitled project)' }),
          el('div', { class: 'meta' }, `@${username}`)
        ])
      ]),
      el('div', { class: 'badges' }, [
        el('span', { class: 'badge count', text: `${count} online (current revision)` }),
        el('span', { class: 'badge', text: `Version: ${rev?.version ?? 'n/a'}` }),
      ]),
      el('div', { class: 'links' }, [
        el('a', { class: 'link', href: projectLink(project.id), target: '_blank', rel: 'noopener', text: 'Project' }),
        rev?.site_id ? el('a', { class: 'link', href: siteLink(rev.site_id), target: '_blank', rel: 'noopener', text: 'Open Site' }) : null
      ])
    ]);
    dom.projectResult.innerHTML = '';
    dom.projectResult.appendChild(card);
  } catch (e) {
    console.error(e);
    dom.projectResult.textContent = 'Unable to load project. Check the ID and try again.';
  } finally {
    dom.checkProjectBtn.disabled = false;
  }
}

/* Event binding */
dom.refreshBtn.addEventListener('click', loadRooms);
dom.exportJsonBtn.addEventListener('click', () => downloadJSON('rooms.json', latestRooms));
dom.filterInput.addEventListener('input', renderRooms);
dom.limitSelect.addEventListener('change', loadRooms);
dom.autoRefreshToggle.addEventListener('change', (e) => setAutoRefresh(e.target.checked));
dom.autoRefreshInterval.addEventListener('change', () => setAutoRefresh(dom.autoRefreshToggle.checked));
dom.checkProjectBtn.addEventListener('click', checkSpecificProject);

/* Initial load */
loadRooms();
/* ...existing code... */

