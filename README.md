# Snip

Snip is a tiny URL shortener demonstrating one backend with two different
clients: a browser UI and a terminal CLI. Each layer lives on its own branch
and is mounted here as a Git submodule.

## Layout

| Branch | Submodule | Technology |
| --- | --- | --- |
| `backend` | `backend/` | Bun API server with in-memory storage |
| `frontend` | `frontend/` | Angular 19 web application |
| `cli` | `cli/` | Zero-dependency Node 20+ CLI |

## API contract

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/api/links` | `{ "url": "https://..." }` | `201 { code, url, shortUrl, hits, createdAt }`; `400` for invalid JSON/URL |
| `GET` | `/api/links` | - | `200` array of links |
| `GET` | `/:code` | - | `302` redirect and incremented hit count; `404` if unknown |

Links are stored in memory, so restarting the backend clears them.

## Clone and run

Clone with submodules populated:

```sh
git clone --recurse-submodules https://github.com/dzachdeveloper/ai-sdlc-day1-workshop.git
cd ai-sdlc-day1-workshop
```

Plain clones leave submodule folders empty; populate them later with
`git submodule update --init --recursive`.

Run the three pieces in separate terminals:

```sh
cd backend && bun start
cd frontend && npm install && npx ng serve
cd cli && node cli.js ls
```

The API runs on `http://localhost:3000`, and the Angular development server
runs on `http://localhost:4200`.

## Updating a layer

Make and push changes from inside the relevant submodule:

```sh
cd backend
git add . && git commit -m "Update backend"
git push
cd ..
git submodule update --remote backend
git add backend
git commit -m "Bump backend submodule"
git push
```

Use the same workflow with `frontend` or `cli`. The submodule commit and the
superproject pointer update are separate commits.
