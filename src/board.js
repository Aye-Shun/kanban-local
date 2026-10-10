export const STORAGE_KEY = 'kanban-local.v1';
export const COLUMNS = ['todo', 'doing', 'done'];
export const MAX_CARDS = 200;
export const MAX_IMPORT_BYTES = 1_000_000;

function exactKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

export function validateBoard(value) {
  if (!exactKeys(value, ['version', 'cards']) || value.version !== 1 || !Array.isArray(value.cards) || value.cards.length > MAX_CARDS) {
    throw new Error('Use a version 1 board with up to 200 cards.');
  }
  const ids = new Set();
  const cards = value.cards.map(card => {
    if (!exactKeys(card, ['id', 'title', 'description', 'column']) ||
      typeof card.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(card.id) || ids.has(card.id) ||
      typeof card.title !== 'string' || !card.title.trim() || card.title.trim().length > 80 ||
      typeof card.description !== 'string' || card.description.length > 1000 || !COLUMNS.includes(card.column)) {
      throw new Error('Every card needs a unique ID, a 1–80 character title, a description up to 1,000 characters, and a valid column.');
    }
    ids.add(card.id);
    return { id: card.id, title: card.title.trim(), description: card.description, column: card.column };
  });
  return { version: 1, cards };
}

export function parseBoard(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error('Choose a JSON file smaller than 1 MB.');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  // Validate the entire document before returning a replacement board.
  return validateBoard(value);
}

export function initialBoard() {
  return { version: 1, cards: [
    { id: 'ideas', title: 'Collect a few good ideas', description: 'What would make this week feel a little more intentional?', column: 'todo' },
    { id: 'small', title: 'Choose one small next step', description: 'Keep it concrete. Keep it achievable.', column: 'todo' },
    { id: 'build', title: 'Make something useful', description: 'An afternoon project, a thoughtful fix, or a tiny improvement.', column: 'doing' },
    { id: 'start', title: 'A place to begin', description: 'Your board is ready. Edit these sample cards or add your own.', column: 'done' },
  ] };
}

export function addCard(data, input, id) {
  return validateBoard({ ...data, cards: [...data.cards, { id, title: input.title, description: input.description, column: input.column }] });
}

export function updateCard(data, id, input) {
  if (!data.cards.some(card => card.id === id)) throw new Error('This card no longer exists.');
  return validateBoard({ ...data, cards: data.cards.map(card => card.id === id ? { ...card, ...input, id } : card) });
}

export function moveCard(data, id, column) {
  if (!COLUMNS.includes(column)) throw new Error('Choose a valid column.');
  return updateCard(data, id, { column });
}

export function removeCard(data, id) {
  return { ...data, cards: data.cards.filter(card => card.id !== id) };
}

export function serializeBoard(data) {
  return JSON.stringify(validateBoard(data), null, 2) + '\n';
}
