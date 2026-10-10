import test from 'node:test';
import assert from 'node:assert/strict';
import { initialBoard, validateBoard, parseBoard, addCard, updateCard, moveCard, removeCard, serializeBoard, MAX_CARDS } from '../src/board.js';

test('create, edit, move, and delete preserve earlier state', () => {
  const original = initialBoard();
  const created = addCard(original, { title: '  New task  ', description: 'Details', column: 'todo' }, 'new');
  assert.equal(created.cards.at(-1).title, 'New task');
  assert.equal(original.cards.length, 4);
  const edited = updateCard(created, 'new', { title: 'Updated task', description: 'New details' });
  const moved = moveCard(edited, 'new', 'done');
  assert.equal(moved.cards.at(-1).column, 'done');
  assert.equal(edited.cards.at(-1).column, 'todo');
  assert.equal(removeCard(moved, 'new').cards.length, 4);
  assert.throws(() => updateCard(original, 'missing', { title: 'No' }));
  assert.throws(() => moveCard(original, 'build', 'invalid'));
});

test('exported boards round-trip without data loss', () => {
  const data = initialBoard();
  assert.deepEqual(parseBoard(serializeBoard(data)), data);
  assert.deepEqual(parseBoard('{"version":1,"cards":[]}'), { version: 1, cards: [] });
});

test('import rejects invalid JSON, wrong schema, and unknown fields', () => {
  for (const value of ['not json', '{}', 'null', '[]', '{"version":2,"cards":[]}', '{"version":1,"cards":[],"extra":true}']) {
    assert.throws(() => parseBoard(value));
  }
  const card = initialBoard().cards[0];
  assert.throws(() => validateBoard({ version: 1, cards: [{ ...card, extra: true }] }));
  assert.throws(() => validateBoard({ version: 1, cards: [{ ...card, description: undefined }] }));
});

test('a mixed valid/invalid import never alters the current board', () => {
  const current = initialBoard();
  const before = serializeBoard(current);
  const incoming = { version: 1, cards: [current.cards[0], { ...current.cards[1], column: 'archive' }] };
  assert.throws(() => parseBoard(JSON.stringify(incoming)));
  assert.equal(serializeBoard(current), before);
});

test('duplicate IDs and out-of-bounds text are rejected', () => {
  const card = initialBoard().cards[0];
  for (const cards of [[card, card], [{ ...card, title: ' ' }], [{ ...card, title: 'x'.repeat(81) }], [{ ...card, description: 'x'.repeat(1001) }], [{ ...card, id: '__ bad' }]]) {
    assert.throws(() => validateBoard({ version: 1, cards }));
  }
  assert.throws(() => addCard(initialBoard(), { title: 'Valid', description: '', column: 'todo' }, 'ideas'));
});

test('import limits bound file size and card count', () => {
  assert.throws(() => parseBoard(' '.repeat(1_000_001)));
  const cards = Array.from({ length: MAX_CARDS + 1 }, (_, i) => ({ id: `card-${i}`, title: 'Task', description: '', column: 'todo' }));
  assert.throws(() => validateBoard({ version: 1, cards }));
});

test('validated data is copied so pending imports do not share card arrays', () => {
  const source = initialBoard();
  const validated = validateBoard(source);
  validated.cards[0].title = 'Changed';
  assert.notEqual(source.cards[0].title, 'Changed');
});
