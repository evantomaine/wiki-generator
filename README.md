# Wiki Generator

WikiGen converts PDF documents into an interconnected Markdown knowledge vault for [Obsidian](https://obsidian.md). Upload documents, review extracted notes, explore their connections, and export a vault to use locally.

## Features

- PDF processing for text, scanned pages, tables, and diagrams.
- Concept notes with Obsidian `[[wikilinks]]` and YAML frontmatter.
- Markdown previews, a vault sidebar, and an interactive graph view.
- Cross-referencing and link validation for exported notes.
- ZIP export with Markdown files and Obsidian configuration.
- A sample vault for exploring the interface.

## Technology

TypeScript, React, Vite, Tailwind CSS, Express, and JSZip.

## Run locally

Use a current Node.js LTS release compatible with the project's Vite version and an npm installation.

```bash
git clone https://github.com/evantomaine/wiki-generator.git
cd wiki-generator
npm install
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env` to your own API key. Keep this file private; it is excluded from Git. PDF processing requires this external service credential.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Set `PORT` in `.env` to use a different port.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express server with Vite development middleware. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm run lint` | Run TypeScript checks. |
| `npm start` | Start the server; set `NODE_ENV=production` to serve the built frontend. |

## Open an exported vault

1. Download `wiki.zip` from the application.
2. Extract the archive.
3. In Obsidian, choose **Open folder as vault** and select the extracted `wiki` folder.
4. Open the graph view to explore connections between notes.
