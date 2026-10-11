# Kanban Local

A React board with **To do**, **In progress**, and **Done** columns. Cards have a title and optional notes.

![Kanban Local](docs/preview.png)

Node 22.12+ and npm:

```sh
npm ci
npm run dev
```

Open the address Vite prints. Add a card, move it using the column buttons, or use **Edit** to change or delete it. There isn't drag-and-drop.

## Saving a board

Changes go into this browser's local storage. **Export** downloads a JSON backup; **Import** validates a file and asks before replacing the current board. Export first if you want to keep the old one. Canceled or invalid imports don't replace it.

Use one tab at a time since tabs don't sync. Clearing browser storage loses the board. If saving fails, you can still export the board held in memory.

Card operations and import checks are in `src/board.js`. The React page handles storage and dialogs. There's no account, server, custom ordering, or undo.

To check changes:

```sh
npm test
npm run build
npm run preview
```

[MIT](LICENSE)
