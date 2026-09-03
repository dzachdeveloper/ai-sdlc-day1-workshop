# Snip backend

Snip is a tiny, dependency-free URL shortener powered by Bun. Links are stored
in memory and are cleared when the server restarts.

Run it with:

```sh
bun start
```

The server listens on port 3000 by default. Set `PORT`, `BASE_URL`, or
`PUBLIC_DIR` to configure it.
