import { resolve, sep } from "node:path";

const links = new Map();
const port = Number(process.env.PORT || 3000);
const baseUrl = (
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${port}`)
).replace(/\/+$/, "");
const publicDir = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function code() {
  let result;
  do {
    result = Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
  } while (links.has(result));
  return result;
}

async function staticFile(pathname) {
  if (!publicDir) return null;
  const relative = pathname === "/" ? "/index.html" : pathname;
  let filePath;
  try {
    filePath = resolve(publicDir, `.${decodeURIComponent(relative)}`);
  } catch {
    return null;
  }
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${sep}`)) {
    return null;
  }
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;
  return new Response(file, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const file = await staticFile(url.pathname);
    if (file) return file;

    if (url.pathname === "/api/links" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (
        !body ||
        typeof body.url !== "string" ||
        !/^https?:\/\//i.test(body.url)
      ) {
        return json({ error: "URL must use http or https" }, 400);
      }
      try {
        new URL(body.url);
      } catch {
        return json({ error: "URL must use http or https" }, 400);
      }
      const entry = {
        code: code(),
        url: body.url,
        shortUrl: "",
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      entry.shortUrl = `${baseUrl}/${entry.code}`;
      links.set(entry.code, entry);
      return json(entry, 201);
    }

    if (url.pathname === "/api/links" && request.method === "GET") {
      return json([...links.values()]);
    }

    if (request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice(1));
      const entry = links.get(key);
      if (entry) {
        entry.hits += 1;
        return new Response(null, {
          status: 302,
          headers: {
            Location: entry.url,
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }
    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip listening on ${server.url}`);
