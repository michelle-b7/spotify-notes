const KEY = 'web_song_notes';

export function saveNote(trackId, note) {
  const all = JSON.parse(localStorage.getItem(KEY) || '{}');
  all[trackId] = { trackId, note, updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getNote(trackId) {
  const all = JSON.parse(localStorage.getItem(KEY) || '{}');
  return all[trackId] || null;
}
