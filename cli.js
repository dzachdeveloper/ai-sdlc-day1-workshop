#!/usr/bin/env node

const { execFile } = require("node:child_process");

const API = (process.env.SNIP_API || "http://localhost:3000").replace(/\/+$/, "");

function usage() {
  console.log(`Usage:
  snip add <url>    Shorten a URL
  snip ls           List shortened links
  snip open <code>  Open a shortened link in your browser`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API}${path}`, options);
  } catch (error) {
    throw new Error(`could not reach backend at ${API}`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`backend returned invalid JSON (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(body.error || `backend returned HTTP ${response.status}`);
  }
  return { body, response };
}

function openBrowser(target) {
  const command = process.platform === "win32"
    ? "cmd.exe"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", target] : [target];
  execFile(command, args, (error) => {
    if (error) console.error(`Could not open browser: ${error.message}`);
  });
}

async function main() {
  const [command, argument] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "add") {
    if (!argument || !/^https?:\/\/\S+$/i.test(argument)) {
      throw new Error("add requires a valid http or https URL");
    }
    const { body } = await request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: argument }),
    });
    console.log(body.shortUrl);
    return;
  }

  if (command === "ls") {
    const { body: links } = await request("/api/links");
    if (!links.length) {
      console.log("No links yet.");
      return;
    }
    const rows = links.map((link) => [link.code, String(link.hits), link.url]);
    const codeWidth = Math.max(4, ...rows.map(([code]) => code.length));
    const hitsWidth = Math.max(4, ...rows.map(([, hits]) => hits.length));
    console.log(`${"CODE".padEnd(codeWidth)}  ${"HITS".padEnd(hitsWidth)}  URL`);
    console.log(`${"-".repeat(codeWidth)}  ${"-".repeat(hitsWidth)}  ---`);
    for (const [code, hits, url] of rows) {
      console.log(`${code.padEnd(codeWidth)}  ${hits.padEnd(hitsWidth)}  ${url}`);
    }
    return;
  }

  if (command === "open") {
    if (!argument || !/^[A-Za-z0-9]{6}$/.test(argument)) {
      throw new Error("open requires a six-character link code");
    }
    let response;
    try {
      response = await fetch(`${API}/${encodeURIComponent(argument)}`, {
        redirect: "manual",
      });
    } catch {
      throw new Error(`could not reach backend at ${API}`);
    }
    if (response.status !== 302) {
      throw new Error(response.status === 404 ? "link code not found" : `backend returned HTTP ${response.status}`);
    }
    const target = response.headers.get("location");
    if (!target) throw new Error("backend returned a redirect without a target");
    console.log(`Opening ${target}`);
    openBrowser(target);
    return;
  }

  throw new Error(`unknown command "${command}"`);
}

main().catch((error) => fail(error.message));
