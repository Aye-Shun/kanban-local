# Kanban Local

A focused React board for moving small tasks from **To do** to **In progress** to **Done**. Everything stays in your browser, with portable JSON backups when you want to move or preserve your board.

![Kanban Local interface](docs/preview.png)

## Features

- Create, edit, and delete cards with a title and optional description.
- Move cards with labeled buttons that work with a mouse or keyboard.
- Choose any column in the card editor.
- Save changes automatically in browser local storage.
- Export the whole board as JSON.
- Validate an entire imported backup before offering to replace the current board.
- Export the current board from the import confirmation dialog before replacement.
- Use responsive columns, native modal dialogs, and labeled form fields.

The initial board contains four clearly written sample cards. Replace them with your own tasks.

## Run locally

Use Node.js **22.12 or newer** and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. To build and preview the production bundle:

```sh
npm run build
npm run preview
```

## JSON backups

Export downloads `kanban-board.json`. The format is small and versioned:

```json
{
  "version": 1,
  "cards": [
    {
      "id": "readme-example",
      "title": "Ship a small improvement",
      "description": "Build, test, and document it.",
      "column": "todo"
    }
  ]
}
```

Allowed columns are `todo`, `doing`, and `done`. The schema accepts only the fields shown above. Each card needs a unique ID containing 1–64 letters, numbers, underscores, or hyphens; a nonblank title up to 80 characters; and a description up to 1,000 characters. A board can contain up to 200 cards. Import files are limited to 1 MB.

Invalid JSON, duplicate IDs, unknown fields, incorrect types, and invalid columns are rejected. Importing is a **whole-board replacement**, not a merge: the app validates every card, shows a confirmation dialog, and replaces the board only when you select **Replace board**. Failed or canceled imports leave your current cards untouched.

## Project structure

```text
src/main.jsx          React UI, dialogs, storage, and file handling
src/board.js          Strict schema validation and immutable card operations
src/style.css         Responsive theme
test/board.test.js    Built-in Node test runner
```

## Tests

```sh
npm test
```

Tests cover card operations, JSON round trips, malformed imports, limits, duplicate IDs, defensive copying, and keeping the current board unchanged when an import is rejected. GitHub Actions is configured to run tests and production builds on Node 22 and 24.

## Storage and limitations

The board is saved under `kanban-local.v1` in local storage for this browser and origin. There is no backend, account, analytics, collaboration, or cross-device sync. Clearing browser data removes the saved board; export a backup to keep a portable copy. If saving fails, the app shows a warning and you can still export the board in memory.

Edit in one tab at a time. Open tabs are not synchronized: the last tab to save replaces the stored board. Your board does not follow browser-account sync; use JSON export/import to move it.

This project uses move buttons rather than drag-and-drop. Cards keep their existing relative order inside each column; reordering, multiple boards, due dates, and undo are outside its scope. Unreadable saved data opens the sample board, and a new save happens only after you make a change.

## Stack

React 19 · Vite 7 · JavaScript · CSS · Node's built-in test runner

## License

MIT © 2026 Kenneth Park. See [LICENSE](LICENSE).
