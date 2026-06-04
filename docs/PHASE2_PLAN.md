# OpenFlowKit Phase 2 Implementation Plan

## Native Capture and Injection

**Status:** Draft  
**Last Updated:** 2026-06-04  
**Target Start:** Post-Phase-1 exit criteria met  
**Estimated Duration:** 4-6 weeks (1 developer, full-time)

---

## 1. Executive Summary

Phase 2 transforms OpenFlowKit from a browser-based web app into a cross-platform desktop application capable of capturing voice and injecting text into any active writing surface. The core goal is to make the capture-to-inject loop work across apps, not only inside a web page.

This plan recommends **Tauri 2** as the desktop framework, provides a step-by-step migration path from the existing Vite React app, defines the integration architecture for local Whisper speech recognition, and specifies how the existing terminal bridge (`bridge/server.ts`) connects into the new desktop wrapper.

---

## 2. Framework Decision: Tauri 2 Over Electron

### 2.1 Why Tauri 2

After evaluating both frameworks against OpenFlowKit's priorities (dictation quality, local-first privacy, low latency, small bundle), Tauri 2 is the clear choice.

| Dimension | Tauri 2 | Electron | Impact for OpenFlowKit |
|-----------|---------|----------|------------------------|
| **Bundle size** | 3-10 MB | 150-300 MB | Faster downloads, cheaper distribution |
| **Memory (idle)** | 30-80 MB | 150-400 MB | Background resident app without bloat |
| **Startup time** | 0.2-0.8s | 1-3s | Hotkey-to-capture feels instant |
| **Security model** | Capability-based allowlist | Context isolation + sandbox | Explicit, declarative permissions |
| **Mobile support** | iOS + Android (same codebase) | None | Future Phase 5 expansion path |
| **Backend language** | Rust | Node.js | Memory safety, native performance |
| **Cross-platform** | Windows, macOS, Linux, iOS, Android | Windows, macOS, Linux | True multi-platform from one codebase |

### 2.2 The Numbers in Context

Real-world benchmarks from 2025-2026 migrations consistently show:

- **95% installer size reduction** when moving from Electron to Tauri
- **70% lower memory footprint** at idle
- **3x faster cold start** on equivalent hardware
- **0-1% CPU at idle** versus 2-5% for Electron

For OpenFlowKit specifically, this matters because the app is designed to be a **background resident utility**. Users will keep it running for hours while switching between VS Code, Slack, email, and browsers. A 300 MB Electron app that eats 200 MB RAM and takes 2 seconds to respond to a hotkey is a worse product than a 6 MB Tauri app that uses 40 MB RAM and responds in 200 ms.

### 2.3 Security Model

Tauri 2 uses a **capability-based security model**. Instead of granting broad Node.js access to the renderer, you declare exactly what each window can do:

```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "global-shortcut:allow-register",
    "shell:allow-execute",
    "fs:allow-appdata-read",
    "fs:allow-appdata-write"
  ]
}
```

This aligns with OpenFlowKit's privacy-first principle. The renderer cannot silently access the file system, spawn processes, or read clipboard history unless explicitly permitted. Rust's memory safety eliminates entire classes of vulnerabilities that Node.js backends are susceptible to.

### 2.4 Trade-offs Acknowledged

Tauri 2 is not without compromises:

- **Rendering consistency:** Uses OS-native webviews (WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux). CSS and JS behavior may vary slightly across platforms. OpenFlowKit's UI is simple enough that this is not a blocker.
- **Ecosystem maturity:** Smaller than Electron's. However, Tauri 2 reached GA in October 2024 and the plugin ecosystem is growing rapidly. All required plugins (global shortcut, shell, clipboard, notification, deep link) are first-party and stable.
- **Rust learning curve:** The backend is Rust, not JavaScript. For a project prioritizing performance and security, this is a feature, not a bug. The Rust surface area is limited to system integration; business logic remains in TypeScript.

---

## 3. Step-by-Step Migration: Vite Web App to Tauri Desktop App

### 3.1 Prerequisites

- Rust toolchain installed (`rustup`)
- Node.js 18+ (already required)
- Existing project at `C:\Users\manaz\openflowkit`

### 3.2 Migration Steps

#### Step 1: Install Tauri CLI and initialize

```bash
# In project root
cd C:\Users\manaz\openflowkit
npm install --save-dev @tauri-apps/cli@latest

# Initialize Tauri (creates src-tauri/ directory)
npx tauri init
```

During initialization, specify:
- **App name:** OpenFlowKit
- **Window title:** OpenFlowKit
- **Frontend dev command:** `npm run dev`
- **Frontend build command:** `npm run build`
- **Frontend dist dir:** `../dist`

#### Step 2: Update Vite configuration

Replace `vite.config.ts` with Tauri-aware settings:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    outDir: "dist",
    target: process.env.TAURI_ENV_PLATFORM === "windows"
      ? "chrome105"
      : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
```

#### Step 3: Configure Tauri application

Update `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "productName": "OpenFlowKit",
  "version": "0.2.0",
  "identifier": "com.openflowkit.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "OpenFlowKit",
        "width": 900,
        "height": 700,
        "resizable": true,
        "fullscreen": false,
        "visible": false,
        "decorations": true
      }
    ],
    "security": {
      "csp": null,
      "capabilities": ["main-capability"]
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage", "deb"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"],
    "externalBin": ["binaries/whisper-cli"]
  },
  "plugins": {
    "global-shortcut": {
      "shortcut": "CommandOrControl+Shift+Space"
    }
  }
}
```

#### Step 4: Add Rust dependencies

Update `src-tauri/Cargo.toml`:

```toml
[package]
name = "openflowkit"
version = "0.2.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-notification = "2"
tauri-plugin-fs = "2"
tauri-plugin-os = "2"
tauri-plugin-process = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

#### Step 5: Add frontend Tauri dependencies

```bash
npm install @tauri-apps/api @tauri-apps/plugin-global-shortcut @tauri-apps/plugin-clipboard-manager @tauri-apps/plugin-notification
```

#### Step 6: Update package.json scripts

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

#### Step 7: Adapt frontend for Tauri environment

The existing React components require minimal changes. Key adaptations:

1. **Replace Web Speech API with Tauri-native capture** (see Section 5)
2. **Replace `localStorage` with Tauri FS plugin** for history persistence
3. **Add Tauri-specific API imports** for clipboard, notifications, and window management
4. **Remove browser-specific code** (e.g., `window.SpeechRecognition` fallbacks)

Example adapter pattern:

```typescript
// src/adapters/tauri.ts
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function injectText(text: string): Promise<void> {
  // Desktop injection via Rust backend
  await invoke("inject_text", { text });
}

export async function copyToClipboard(text: string): Promise<void> {
  await writeText(text);
}
```

#### Step 8: Build and verify

```bash
# Development mode with hot reload
npm run tauri:dev

# Production build
npm run tauri:build
```

---

## 4. File Structure for Phase 2

### 4.1 New Directory Layout

```text
openflowkit/
├── src/                          # Existing frontend (React + Vite)
│   ├── components/               # VoiceCapture, DictationLab, TerminalBridge, etc.
│   ├── core/                     # capture, dictation, refine, writingModes, types
│   ├── hooks/                    # useSpeechRecognition, useHistory, etc.
│   ├── adapters/                 # NEW: Tauri API wrappers
│   │   ├── tauri.ts              # Desktop-specific APIs
│   │   ├── web.ts                # Browser fallback (for web build)
│   │   └── index.ts              # Platform-agnostic exports
│   ├── main.tsx                  # Entry point (minimal changes)
│   └── App.tsx                   # Main app component
├── src-tauri/                    # NEW: Rust backend
│   ├── src/
│   │   ├── main.rs               # Entry point, plugin init
│   │   ├── lib.rs                # Module exports
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   ├── inject.rs         # Text injection into active field
│   │   │   ├── capture.rs        # Microphone capture control
│   │   │   ├── window.rs         # Window management (show/hide/focus)
│   │   │   └── bridge.rs         # Terminal bridge integration
│   │   ├── services/             # Business logic modules
│   │   │   ├── mod.rs
│   │   │   ├── audio.rs          # Audio stream handling
│   │   │   ├── whisper.rs        # whisper.cpp integration
│   │   │   ├── clipboard.rs      # Clipboard preservation/injection
│   │   │   └── hotkey.rs         # Global shortcut registration
│   │   └── utils/
│   │       └── mod.rs
│   ├── capabilities/
│   │   └── main-capability.json  # Permission declarations
│   ├── binaries/                 # Sidecar binaries (whisper.cpp CLI)
│   │   └── whisper-cli-x86_64-pc-windows-msvc.exe
│   ├── icons/
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
├── bridge/                       # EXISTING: Terminal bridge server
│   └── server.ts                 # WebSocket server for terminal injection
├── docs/
│   ├── PHASE2_PLAN.md            # This document
│   └── ...
├── public/
├── models/                       # NEW: Downloaded Whisper GGML models
│   ├── ggml-base.en.bin
│   └── ggml-small.en.bin
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 4.2 Key File Responsibilities

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Initializes Tauri app, registers plugins, sets up global shortcuts, configures window behavior |
| `src-tauri/src/commands/inject.rs` | Receives refined text from frontend, injects into active text field via OS APIs |
| `src-tauri/src/commands/capture.rs` | Starts/stops microphone capture, streams audio to whisper.cpp |
| `src-tauri/src/services/whisper.rs` | Manages whisper.cpp sidecar process, handles model loading, runs transcription |
| `src-tauri/src/services/hotkey.rs` | Registers global shortcuts (e.g., Cmd+Shift+Space), triggers capture window |
| `src/adapters/tauri.ts` | Frontend wrapper for Tauri invoke commands, provides typed API surface |
| `bridge/server.ts` | Existing WebSocket server; adapted to receive commands from Tauri backend |

---

## 5. Global Hotkey Implementation

### 5.1 Recommended Hotkey

**Primary:** `Cmd+Shift+Space` (macOS) / `Ctrl+Shift+Space` (Windows/Linux)

This combination:
- Does not conflict with common IDE shortcuts
- Is easy to press one-handed while the other hand is on the mouse
- Mirrors Spotlight (Cmd+Space) muscle memory
- Is used by similar productivity tools (Alfred, Raycast)

### 5.2 Implementation Pattern

#### Rust side (`src-tauri/src/services/hotkey.rs`):

```rust
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

pub fn register_hotkey(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::SHIFT | Modifiers::SUPER),
        Code::Space,
    );

    app.global_shortcut().register(shortcut)?;

    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, sc, event| {
                if sc == &shortcut && event.state() == ShortcutState::Pressed {
                    // Toggle capture window or start dictation
                    let _ = app.emit("hotkey-triggered", ());
                }
            })
            .build(),
    )?;

    Ok(())
}
```

#### Frontend side (`src/adapters/tauri.ts`):

```typescript
import { listen } from "@tauri-apps/api/event";

export function onHotkeyTriggered(callback: () => void): () => void {
  const unlisten = listen("hotkey-triggered", () => {
    callback();
  });
  return () => { unlisten.then((fn) => fn()); };
}
```

#### React integration (`src/components/VoiceCapture.tsx`):

```typescript
useEffect(() => {
  const unsubscribe = onHotkeyTriggered(() => {
    handleToggle(); // Start or stop dictation
  });
  return unsubscribe;
}, [handleToggle]);
```

### 5.3 Window Behavior on Hotkey

When the hotkey is pressed:

1. **If idle:** Show a small floating capture window (300x120px) near the cursor or screen center. Start listening immediately.
2. **If capturing:** Stop capture, hide the window, inject the refined text into the previously active app.
3. **If processing:** Show a brief "Processing..." indicator, then inject when ready.

The main window remains hidden during normal operation. Only the capture overlay appears during dictation.

### 5.4 Alternative Hotkeys

Allow users to customize via settings:

| Preset | macOS | Windows/Linux |
|--------|-------|---------------|
| Default | Cmd+Shift+Space | Ctrl+Shift+Space |
| Alt | Cmd+Shift+D | Ctrl+Shift+D |
| Function | Fn+F13 | Ctrl+Alt+V |

Store preference in Tauri's app data directory using the FS plugin.

---

## 6. Local whisper.cpp Integration

### 6.1 Integration Strategy: Sidecar Pattern

Tauri 2 supports **sidecars** — external binaries bundled with the app and spawned as child processes. This is the recommended approach for whisper.cpp because:

- whisper.cpp is a mature C++ project with its own build system
- Prebuilt binaries exist for all target platforms
- No need to rewrite transcription logic in Rust
- Easy to swap models by replacing the GGML file
- GPU acceleration (Metal, Vulkan, CUDA) works out of the box with official builds

### 6.2 whisper.cpp Node Addon Options

Two viable Node.js addon options were evaluated:

#### Option A: `whisper-cpp-node` (Recommended)

- **Pros:** Active maintenance, TypeScript definitions, GPU auto-detection, streaming VAD, Core ML support on macOS, self-contained (no external deps)
- **Cons:** Requires Node.js runtime in the Tauri context (sidecar or custom build)
- **Best for:** Teams comfortable with a Node.js sidecar process

```typescript
import { createWhisperContext, getGpuDevices } from "whisper-cpp-node";

const ctx = createWhisperContext({
  model: "./models/ggml-base.en.bin",
  use_gpu: true,
  use_coreml: true, // macOS only
});

const result = ctx.transcribe(audioBuffer);
```

#### Option B: `@kutalia/whisper-node-addon`

- **Pros:** Prebuilt `.node` binaries for all platforms, zero-config for Electron/Tauri, Vulkan/OpenBLAS backends, real-time PCM streaming
- **Cons:** Fork of older project, less documentation, CUDA support still pending
- **Best for:** Quick integration without building from source

```typescript
import whisper from "@kutalia/whisper-node-addon";

const result = await whisper.transcribe({
  fname_inp: "audio.wav",
  model: "ggml-base.en.bin",
  language: "en",
  use_gpu: true,
});
```

#### Decision: Use `whisper-cpp-node` as the primary integration

Rationale:
- Better maintained with regular releases
- Superior macOS support (Core ML gives 3x speedup on Apple Silicon)
- Built-in VAD reduces false transcriptions
- TypeScript-first API matches the project's stack

### 6.3 Architecture: Tauri + whisper.cpp Sidecar

```text
┌─────────────────────────────────────────────────────────────┐
│                    OpenFlowKit Desktop App                   │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  React UI    │◄────►│  Tauri Rust   │                   │
│  │  (src/)      │ IPC  │  (src-tauri/) │                   │
│  └──────────────┘      └──────┬───────┘                   │
│                               │                             │
│                        ┌──────┴───────┐                     │
│                        │  Sidecar     │                     │
│                        │ whisper-cli   │                     │
│                        │ (C++ binary)  │                     │
│                        └──────┬───────┘                     │
│                               │                             │
│                        ┌──────┴───────┐                     │
│                        │  GGML Model  │                     │
│                        │ (base/small) │                     │
│                        └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Rust Sidecar Integration

```rust
// src-tauri/src/services/whisper.rs
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tauri::Emitter;

pub async fn transcribe_audio(
    app: tauri::AppHandle,
    audio_path: String,
    model_path: String,
) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("whisper-cli")
        .map_err(|e| e.to_string())?
        .args([
            "-m", &model_path,
            "-f", &audio_path,
            "-l", "en",
            "--output-json",
            "-pp", // print progress
        ]);

    let (mut rx, mut _child) = sidecar
        .spawn()
        .map_err(|e| e.to_string())?;

    let mut output = String::new();

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                output.push_str(&String::from_utf8_lossy(&line));
            }
            CommandEvent::Stderr(line) => {
                let err = String::from_utf8_lossy(&line);
                app.emit("transcription-progress", err.to_string()).ok();
            }
            CommandEvent::Error(e) => {
                return Err(format!("Sidecar error: {}", e));
            }
            _ => {}
        }
    }

    Ok(output)
}
```

### 6.5 Model Management

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| ggml-tiny.en | 39 MB | Fastest | Basic | Low-end hardware, quick drafts |
| ggml-base.en | 74 MB | Fast | Good | Default for most users |
| ggml-small.en | 244 MB | Medium | Better | Pro users, accuracy-critical |
| ggml-medium.en | 769 MB | Slow | Best | Enterprise, offline precision |

**Distribution strategy:**
- Ship `ggml-base.en.bin` with the installer (74 MB)
- Download larger models on demand via in-app settings
- Store models in `app_data_dir/models/`
- Verify model checksums on first load

### 6.6 GPU Acceleration Matrix

| Platform | GPU API | whisper.cpp Flag | Requirements |
|----------|---------|-------------------|--------------|
| macOS (Apple Silicon) | Metal | `--use-gpu` | Built-in, automatic |
| macOS (Apple Silicon) | Core ML | `--use-coreml` | macOS 13.3+, 3x faster |
| Windows | Vulkan | `--use-gpu` | Vulkan-capable GPU |
| Windows | CUDA | `--use-gpu` | NVIDIA GPU, CUDA toolkit |
| Linux | Vulkan | `--use-gpu` | Vulkan drivers |
| Linux | CUDA | `--use-gpu` | NVIDIA GPU, CUDA toolkit |
| Intel (all) | OpenVINO | `--use-openvino` | Intel CPU/iGPU/NPU |

The Rust sidecar launcher should detect the platform and append the appropriate flags automatically.

---

## 7. Terminal Bridge Integration

### 7.1 Current Architecture

The existing `bridge/server.ts` is a WebSocket server that runs independently of the frontend. It:
- Listens on `ws://localhost:8765`
- Receives dictation text from the web app
- Injects text into the active terminal using platform-specific automation (AppleScript on macOS, PowerShell on Windows, xdotool on Linux)
- Supports command mode for executing shell commands directly

### 7.2 Integration with Tauri Desktop Wrapper

In Phase 2, the terminal bridge becomes a **Tauri-managed sidecar process** rather than a standalone server. This provides:

- **Lifecycle management:** Tauri starts/stops the bridge with the app
- **Port allocation:** No hardcoded port conflicts
- **IPC instead of WebSocket:** Direct Rust-to-Node communication via Tauri's shell plugin
- **Single installer:** Bridge is bundled, not a separate install step

### 7.3 Updated Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    OpenFlowKit Desktop App                   │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │  React UI    │◄────►│  Tauri Rust   │◄────►│ Terminal │ │
│  │              │ IPC  │  Backend     │ Shell│ Bridge   │ │
│  └──────────────┘      └──────────────┘      │ Sidecar  │ │
│                                               └────┬─────┘ │
│                                                    │       │
│                                               ┌────┴─────┐ │
│                                               │  OS APIs │ │
│                                               │ (paste/  │ │
│                                               │  type)    │ │
│                                               └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Implementation Plan

#### Step 1: Bundle bridge as sidecar

Move `bridge/server.ts` to `src-tauri/binaries/bridge/` and package it as an executable Node.js script using `pkg` or `nexe`:

```bash
# Build bridge executable
npx pkg bridge/server.ts --targets node18-win-x64,node18-macos-x64,node18-linux-x64 --output src-tauri/binaries/bridge
```

Update `tauri.conf.json`:

```json
{
  "bundle": {
    "externalBin": ["binaries/bridge", "binaries/whisper-cli"]
  }
}
```

#### Step 2: Rust command to communicate with bridge

```rust
// src-tauri/src/commands/bridge.rs
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn inject_to_terminal(
    app: tauri::AppHandle,
    text: String,
    mode: String, // "paste" or "type"
) -> Result<(), String> {
    let sidecar = app
        .shell()
        .sidecar("bridge")
        .map_err(|e| e.to_string())?;

    let output = sidecar
        .arg("--action", &mode)
        .arg("--text", &text)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
```

#### Step 3: Frontend adapter

```typescript
// src/adapters/tauri.ts
import { invoke } from "@tauri-apps/api/core";

export async function injectToTerminal(text: string, mode: "paste" | "type" = "paste"): Promise<void> {
  await invoke("inject_to_terminal", { text, mode });
}
```

#### Step 4: Update DictationPipeline

Modify `src/core/dictation.ts` to use the Tauri adapter when running in desktop mode:

```typescript
import { injectToTerminal } from "../adapters/tauri";

// In DictationPipeline.stop():
if (this.context.mode === "command") {
  await injectToTerminal(result.refinedText, "type");
} else {
  await injectToTerminal(result.refinedText, "paste");
}
```

### 7.5 Fallback for Web Build

The existing WebSocket-based bridge remains functional for the browser build. Use environment detection:

```typescript
// src/adapters/index.ts
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export const inject = isTauri
  ? (await import("./tauri")).injectToTerminal
  : (await import("./web")).injectViaWebSocket;
```

---

## 8. Dependencies

### 8.1 New Production Dependencies (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| `@tauri-apps/api` | `^2.0.0` | Core Tauri JavaScript API |
| `@tauri-apps/plugin-global-shortcut` | `^2.0.0` | Global hotkey registration |
| `@tauri-apps/plugin-clipboard-manager` | `^2.0.0` | Clipboard read/write |
| `@tauri-apps/plugin-notification` | `^2.0.0` | Desktop notifications |
| `whisper-cpp-node` | `^1.0.0` | Local Whisper STT (optional, loaded dynamically) |

### 8.2 New Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tauri-apps/cli` | `^2.0.0` | Tauri CLI for build/dev |
| `@tauri-apps/plugin-shell` | `^2.0.0` | Shell/sidecar execution |
| `@tauri-apps/plugin-fs` | `^2.0.0` | File system access |
| `@tauri-apps/plugin-os` | `^2.0.0` | OS detection |
| `pkg` | `^5.8.1` | Bundle bridge/server.ts as executable |

### 8.3 Rust Dependencies (Cargo)

| Crate | Version | Purpose |
|-------|---------|---------|
| `tauri` | `2` | Core framework |
| `tauri-build` | `2` | Build helpers |
| `tauri-plugin-shell` | `2` | Sidecar/process spawning |
| `tauri-plugin-global-shortcut` | `2` | Global hotkeys |
| `tauri-plugin-clipboard-manager` | `2` | Clipboard operations |
| `tauri-plugin-notification` | `2` | System notifications |
| `tauri-plugin-fs` | `2` | File system |
| `tauri-plugin-os` | `2` | OS info |
| `serde` | `1` | Serialization |
| `serde_json` | `1` | JSON handling |
| `tokio` | `1` | Async runtime |

### 8.4 External Binaries (Sidecars)

| Binary | Source | Size | Platforms |
|--------|--------|------|-----------|
| `whisper-cli` | whisper.cpp releases | ~2-5 MB | Win, macOS, Linux |
| `bridge` | Packaged `bridge/server.ts` | ~40 MB (includes Node) | Win, macOS, Linux |

---

## 9. Timeline and Effort Estimates

### 9.1 Work Breakdown

| Component | Effort | Dependencies | Risk |
|-----------|--------|------------|------|
| **Tauri project setup** | 1 day | None | Low |
| **Vite config migration** | 0.5 day | Tauri setup | Low |
| **Rust backend scaffold** | 2 days | Tauri setup | Low |
| **Global hotkey system** | 2 days | Rust scaffold | Medium |
| **Window management** (show/hide/float) | 2 days | Hotkey system | Medium |
| **whisper.cpp sidecar integration** | 3 days | Rust scaffold | Medium |
| **Model download/management UI** | 2 days | whisper integration | Low |
| **Terminal bridge adaptation** | 2 days | Sidecar pattern | Low |
| **Clipboard injection** | 2 days | Rust backend | Medium |
| **Audio capture (microphone)** | 3 days | whisper integration | High |
| **Settings persistence** | 1 day | FS plugin | Low |
| **Notification system** | 1 day | Notification plugin | Low |
| **Build pipeline (CI/CD)** | 2 days | All components | Medium |
| **Testing (manual + automated)** | 3 days | All components | Medium |
| **Documentation** | 1 day | All components | Low |

**Total estimated effort:** 4-6 weeks (1 developer, full-time)

### 9.2 Milestones

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| **Week 1** | Foundation | Tauri app boots, Vite integration works, dev loop functional |
| **Week 2** | Hotkeys + Window | Global shortcut opens floating capture window, window hides on escape |
| **Week 3** | Local STT | whisper.cpp sidecar runs, transcribes audio, returns text to UI |
| **Week 4** | Injection | Text injects into active field via clipboard or type simulation |
| **Week 5** | Bridge + Polish | Terminal bridge integrated, settings persist, notifications work |
| **Week 6** | Build + Test | Signed installers for all platforms, manual QA complete |

### 9.3 Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| whisper.cpp sidecar fails on some GPUs | Medium | High | Graceful fallback to CPU, user-visible setting to disable GPU |
| WebView2 not installed (Windows) | Low | High | Bundle WebView2 bootstrapper in installer |
| macOS accessibility permissions denied | Medium | High | Clear onboarding flow, link to System Settings |
| Audio capture latency too high | Medium | Medium | Stream audio in chunks, show interim results, allow cloud fallback |
| Hotkey conflicts with user apps | Medium | Low | Customizable hotkey in settings |

---

## 10. Platform-Specific Notes

### 10.1 macOS

- **Permissions required:** Microphone, Accessibility (for text injection), Screen Recording (optional, for app context)
- **Notarization:** Required for distribution outside App Store
- **Code signing:** Required for Gatekeeper
- **Core ML:** whisper.cpp runs 3x faster with `--use-coreml` on Apple Silicon
- **Injection method:** AppleScript or Accessibility API (AXUIElement)

### 10.2 Windows

- **Permissions required:** Microphone
- **WebView2:** Required runtime; bundle bootstrapper if not present
- **Code signing:** EV certificate recommended for SmartScreen reputation
- **Injection method:** `SendInput` API or PowerShell `Set-Clipboard` + paste
- **GPU:** Vulkan widely supported; CUDA for NVIDIA cards

### 10.3 Linux

- **Permissions required:** Microphone (PulseAudio/PipeWire)
- **WebKitGTK:** Required; most modern distros ship it
- **Distribution:** AppImage for universal compatibility, `.deb` for Debian/Ubuntu
- **Injection method:** `xdotool` or `wl-clipboard` + paste (Wayland vs X11 complexity)
- **GPU:** Vulkan for AMD/Intel, CUDA for NVIDIA

---

## 11. Exit Criteria

Phase 2 is complete when:

1. [ ] User presses global hotkey and a capture window appears within 300 ms
2. [ ] Voice dictation captures, transcribes locally, and refines text end-to-end
3. [ ] Refined text injects into the active text field of another application
4. [ ] Clipboard is preserved and restored after injection
5. [ ] Terminal bridge (`bridge/server.ts`) works through the Tauri sidecar
6. [ ] Privacy mode blocks app context access unless explicitly enabled
7. [ ] Speech-stop-to-injection latency is measured and logged
8. [ ] Signed installers exist for Windows (.msi), macOS (.dmg), and Linux (.AppImage, .deb)
9. [ ] Free users retain full local dictation without internet connection
10. [ ] All Phase 1 functionality remains intact in the desktop build

---

## 12. Appendix A: Tauri Command Reference

Commands exposed from Rust to frontend:

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `start_capture` | `{ device?: string }` | `boolean` | Begin microphone recording |
| `stop_capture` | `{}` | `{ audioPath: string }` | Stop recording, return file path |
| `transcribe` | `{ audioPath: string, model: string }` | `string` | Run whisper.cpp on audio file |
| `inject_text` | `{ text: string, mode: "paste" | "type" }` | `void` | Inject text into active field |
| `copy_to_clipboard` | `{ text: string }` | `void` | Copy text to system clipboard |
| `get_clipboard` | `{}` | `string` | Read current clipboard content |
| `show_window` | `{}` | `void` | Show capture window |
| `hide_window` | `{}` | `void` | Hide capture window |
| `get_settings` | `{}` | `Settings` | Load user preferences |
| `save_settings` | `{ settings: Settings }` | `void` | Persist user preferences |
| `get_gpu_info` | `{}` | `GpuInfo[]` | List available GPU backends |
| `download_model` | `{ model: string }` | `Progress` | Download GGML model |
| `inject_to_terminal` | `{ text: string, mode: string }` | `void` | Send text to terminal bridge |

---

## 13. Appendix B: whisper.cpp Build Matrix

Prebuilt binaries to acquire or build:

| Target Triple | whisper.cpp Binary | GPU Support | Source |
|---------------|-------------------|-------------|--------|
| `x86_64-pc-windows-msvc` | `whisper-cli.exe` | Vulkan, CUDA | GitHub releases |
| `aarch64-apple-darwin` | `whisper-cli` | Metal, Core ML | GitHub releases |
| `x86_64-apple-darwin` | `whisper-cli` | Metal | GitHub releases |
| `x86_64-unknown-linux-gnu` | `whisper-cli` | Vulkan, CUDA | GitHub releases |
| `aarch64-unknown-linux-gnu` | `whisper-cli` | Vulkan | Build from source |

Download URL pattern:
```
https://github.com/ggerganov/whisper.cpp/releases/download/v<VERSION>/whisper-bin-<PLATFORM>.zip
```

---

## 14. Appendix C: References

- Tauri 2 Documentation: https://v2.tauri.app/
- Tauri Global Shortcut Plugin: https://v2.tauri.app/plugin/global-shortcut/
- Tauri Sidecar Guide: https://v2.tauri.app/develop/sidecar/
- whisper.cpp Repository: https://github.com/ggerganov/whisper.cpp
- whisper-cpp-node: https://www.npmjs.com/package/whisper-cpp-node
- @kutalia/whisper-node-addon: https://www.npmjs.com/package/@kutalia/whisper-node-addon
- OpenFlowKit Phase 1 Architecture: `docs/architecture.md`
- OpenFlowKit Roadmap: `docs/roadmap.md`

---

*End of Phase 2 Implementation Plan*
