// Lightweight API helpers for Websim endpoints
const API_BASE = '/api/v1';

export async function getRoomsFeed({ limit = 24, offset = 0 } = {}) {
  const url = new URL(`${API_BASE}/feed/rooms`, window.location.origin);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch rooms: ${res.status}`);
  const body = await res.json();
  return body.feed; // array of {project, project_revision, room}
}

export async function getProject(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error(`Failed to fetch project ${projectId}: ${res.status}`);
  return res.json(); // { project, project_revision, site, ... }
}

