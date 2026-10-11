import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { STORAGE_KEY, COLUMNS, MAX_CARDS, MAX_IMPORT_BYTES, initialBoard, parseBoard, addCard, updateCard, moveCard, removeCard, serializeBoard } from './board.js';
import './style.css';

const LABELS = { todo: 'To do', doing: 'In progress', done: 'Done' };
function readSaved() {
  try { const value = localStorage.getItem(STORAGE_KEY); return { data: value ? parseBoard(value) : initialBoard(), notice: '' }; }
  catch { return { data: initialBoard(), notice: 'Saved data could not be read. Sample cards are shown; make a change to save a fresh board.' }; }
}

function App() {
  const [saved] = useState(readSaved);
  const [data, setData] = useState(saved.data);
  const [notice, setNotice] = useState(saved.notice);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [draft, setDraft] = useState({ title: '', description: '', column: 'todo' });
  const [pendingImport, setPendingImport] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const initialSave = useRef(true);
  const editorDialog = useRef(null);
  const importDialog = useRef(null);
  const fileInput = useRef(null);
  useEffect(() => {
    if (initialSave.current) { initialSave.current = false; return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }, [data]);
  useEffect(() => {
    if (editor && !editorDialog.current.open) {
      editorDialog.current.showModal();
      editorDialog.current.querySelector('#card-title')?.focus();
    }
  }, [editor]);
  useEffect(() => { if (pendingImport && !importDialog.current.open) importDialog.current.showModal(); }, [pendingImport]);
  function openEditor(card = null, column = 'todo') {
    setEditorError('');
    setDraft(card ? { title: card.title, description: card.description, column: card.column } : { title: '', description: '', column });
    setEditor(card ? { id: card.id } : { id: null });
  }
  function closeEditor() { editorDialog.current.close(); setEditor(null); }
  function saveCard(event) {
    event.preventDefault();
    try {
      setData(editor.id ? updateCard(data, editor.id, draft) : addCard(data, draft, crypto.randomUUID()));
      setNotice(editor.id ? 'Card updated.' : 'Card added.'); closeEditor();
    } catch (error) { setEditorError(error.message); }
  }
  function exportBoard() {
    const url = URL.createObjectURL(new Blob([serializeBoard(data)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'kanban-board.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Board exported as a JSON backup.');
  }
  async function importBoard(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setImportBusy(true);
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('Choose a JSON file smaller than 1 MB.');
      setPendingImport({ data: parseBoard(await file.text()), name: file.name }); setNotice('');
    } catch (error) { setNotice(`${error.message} Your board has not changed.`); }
    finally { setImportBusy(false); }
  }
  function closeImport() { importDialog.current.close(); setPendingImport(null); }
  return <main className="shell">
    <header className="page-heading"><h1>Task board</h1><p>Add cards and use the buttons to move them between columns.</p></header>
    <div className="toolbar"><button onClick={() => openEditor()} disabled={data.cards.length >= MAX_CARDS}>New card</button><button onClick={() => fileInput.current.click()} disabled={importBusy}>{importBusy ? 'Reading…' : 'Import JSON'}</button><button onClick={exportBoard}>Export JSON</button><input className="sr-only" type="file" accept=".json,application/json" aria-label="Choose a board JSON backup" ref={fileInput} onChange={importBoard} tabIndex="-1" /><span className="board-count">{data.cards.length} cards · {data.cards.filter(card => card.column === 'done').length} done</span></div>
    <section className="board" aria-label="Personal Kanban board">{COLUMNS.map((column, columnIndex) => <section className="column" key={column} aria-labelledby={`heading-${column}`}><header className="column-heading"><h2 id={`heading-${column}`}>{LABELS[column]} <span>({data.cards.filter(card => card.column === column).length})</span></h2></header><div className="cards">{data.cards.filter(card => card.column === column).map(card => <article className="card" key={card.id}><div className="card-heading"><h3>{card.title}</h3><button className="edit" aria-label={`Edit card: ${card.title}`} onClick={() => openEditor(card)}>Edit</button></div>{card.description && <p>{card.description}</p>}<div className="move-controls">{columnIndex > 0 && <button aria-label={`Move ${card.title} to ${LABELS[COLUMNS[columnIndex - 1]]}`} onClick={() => { setData(moveCard(data, card.id, COLUMNS[columnIndex - 1])); setNotice(`Moved ${card.title} to ${LABELS[COLUMNS[columnIndex - 1]]}.`); }}>← {LABELS[COLUMNS[columnIndex - 1]]}</button>}{columnIndex < 2 && <button className="move-next" aria-label={`Move ${card.title} to ${LABELS[COLUMNS[columnIndex + 1]]}`} onClick={() => { setData(moveCard(data, card.id, COLUMNS[columnIndex + 1])); setNotice(`Moved ${card.title} to ${LABELS[COLUMNS[columnIndex + 1]]}.`); }}>{LABELS[COLUMNS[columnIndex + 1]]} →</button>}</div></article>)}{!data.cards.some(card => card.column === column) && <div className="empty-column"><p>No cards in this column.</p></div>}</div><button className="add-card" onClick={() => openEditor(null, column)} disabled={data.cards.length >= MAX_CARDS}>Add a card</button></section>)}</section>
    <div className="status" role="status">{!storageAvailable ? 'Your board is in memory, but saving failed. Export a backup before closing this tab.' : notice}</div>
    <footer>{storageAvailable ? 'Stored in this browser. Export JSON to keep a backup.' : 'Saving unavailable. Export JSON to keep your changes.'}</footer>
    <dialog ref={editorDialog} onCancel={() => setEditor(null)} aria-labelledby="editor-title"><form onSubmit={saveCard}><div className="dialog-header"><h2 id="editor-title">{editor?.id ? 'Edit card' : 'New card'}</h2><button type="button" className="close" aria-label="Close card editor" onClick={closeEditor}>×</button></div><label htmlFor="card-title">Title <span>80 characters max</span></label><input autoFocus id="card-title" required pattern={'.*\\S.*'} title="Include at least one non-space character" maxLength="80" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Review lecture notes" /><label htmlFor="card-description">Description <span>Optional</span></label><textarea id="card-description" maxLength="1000" rows="4" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Add notes or a short description" /><label htmlFor="card-column">Column</label><select id="card-column" value={draft.column} onChange={event => setDraft({ ...draft, column: event.target.value })}>{COLUMNS.map(column => <option key={column} value={column}>{LABELS[column]}</option>)}</select>{editorError && <p role="alert" className="editor-error">{editorError}</p>}<div className="dialog-actions">{editor?.id && <button type="button" className="danger" onClick={() => { setData(removeCard(data, editor.id)); setNotice('Card deleted.'); closeEditor(); }}>Delete card</button>}<button type="button" className="outline" onClick={closeEditor}>Cancel</button><button className="primary">{editor?.id ? 'Save changes' : 'Add card'}</button></div></form></dialog>
    <dialog ref={importDialog} onCancel={() => setPendingImport(null)} aria-labelledby="import-title"><div className="dialog-header"><h2 id="import-title">Replace your board?</h2><button className="close" aria-label="Cancel import" onClick={closeImport}>×</button></div><p className="import-copy"><strong>{pendingImport?.name}</strong> contains {pendingImport?.data.cards.length} validated cards. Importing replaces all {data.cards.length} cards on your current board.</p><p className="import-copy">Export your current board first if you want to keep a backup.</p><div className="dialog-actions"><button className="outline" onClick={exportBoard}>Export current</button><button className="outline" onClick={closeImport}>Cancel</button><button className="primary" onClick={() => { setData(pendingImport.data); closeImport(); setNotice('Board imported.'); }}>Replace board</button></div></dialog>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
