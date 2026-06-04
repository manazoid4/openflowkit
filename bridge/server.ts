import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { execSync, type ExecSyncOptions } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PORT = 7373;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function setCors(res: ServerResponse) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.setHeader(k, v);
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => { resolve(data); });
  });
}

function toClipboard(text: string) {
  const platform = process.platform;
  const opts: ExecSyncOptions = { encoding: "utf8", windowsHide: true };
  if (platform === "win32") {
    execSync(`powershell -command "Set-Clipboard -Value '${text.replace(/'/g, "''")}'"`, opts);
  } else if (platform === "darwin") {
    const echo = execSync("which echo", opts).trim();
    execSync(`${echo} ${JSON.stringify(text)} | pbcopy`, opts);
  } else {
    try {
      execSync(`wl-copy`, { input: text, ...opts });
    } catch {
      execSync(`xclip -selection clipboard`, { input: text, ...opts });
    }
  }
}

function typeText(text: string) {
  const platform = process.platform;
  if (platform === "win32") {
    const vbs = `Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.SendKeys ${JSON.stringify(text)}`;
    const path = join(tmpdir(), `ofk_type_${Date.now()}.vbs`);
    writeFileSync(path, vbs, "utf8");
    try {
      execSync(`cscript //NoLogo "${path}"`, { windowsHide: true });
    } finally {
      try { unlinkSync(path); } catch {}
    }
  } else if (platform === "darwin") {
    const script = `tell application "System Events" to keystroke ${JSON.stringify(text)}`;
    execSync(`osascript -e ${JSON.stringify(script)}`);
  } else {
    execSync(`xdotool type --delay 1 ${JSON.stringify(text)}`);
  }
}

const server = createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return;
  }

  const url = req.url ?? "/";

  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, version: "0.1.0", platform: process.platform }));
    return;
  }

  if (url === "/inject") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);
      const text: string = payload.text ?? "";
      const action: "clipboard" | "type" = payload.action ?? "clipboard";

      if (!text) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Missing text" }));
        return;
      }

      if (action === "clipboard") {
        toClipboard(text);
      } else if (action === "type") {
        typeText(text);
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Unknown action" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, action, length: text.length }));
      return;
    } catch (e: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: e.message }));
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`OpenFlowKit Terminal Bridge listening on http://127.0.0.1:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /inject  { text: string, action: "clipboard" | "type" }`);
  console.log(`  GET  /health`);
});
