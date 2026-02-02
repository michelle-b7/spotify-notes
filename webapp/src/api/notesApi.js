// local for now, backend later
// fetch('/api/notes', ...)

import { getNote, saveNote } from '../storage/notesStorage';

export async function fetchNote(trackId) {
  return getNote(trackId);
}

export async function updateNote(trackId, note) {
  saveNote(trackId, note);
}
