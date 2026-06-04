# OpenFlowKit Terminal Bridge

A tiny local HTTP server that receives refined text from the OpenFlowKit web app and injects it into your active terminal or application.

## How it works

1. The bridge runs on `http://127.0.0.1:7373`
2. The OpenFlowKit web app detects if the bridge is running
3. When you click **Send to Terminal**, the app POSTs text to `/inject`
4. The bridge copies it to your clipboard (or types it directly, depending on config)

## Running the bridge

```bash
# From the repo root
node bridge/server.ts

# Or with tsx / ts-node
npx tsx bridge/server.ts
```

## Endpoints

- `GET /health` — check if bridge is alive
- `POST /inject` — send text
  - Body: `{ "text": "hello world", "action": "clipboard" | "type" }`

## Platform support

| Action     | Windows              | macOS                | Linux                |
| ---------- | -------------------- | -------------------- | -------------------- |
| clipboard  | PowerShell Set-Clipboard | pbcopy           | wl-copy / xclip      |
| type       | VBScript SendKeys    | osascript keystroke  | xdotool type         |

> **Tip:** `clipboard` is the safest default. Switch to `type` only if you want direct keystroke injection without pasting.
