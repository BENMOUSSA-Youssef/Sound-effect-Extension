"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('Terminal Error Sound extension is now active!');
    const soundProvider = new SoundPlayerProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('kt5awar-player', soundProvider));
    // Register command to manually activate
    context.subscriptions.push(vscode.commands.registerCommand('kt5awar.activatePlayer', () => {
        vscode.commands.executeCommand('kt5awar-player.focus');
    }));
    // Try to auto-activate the player view after a short delay
    setTimeout(() => {
        vscode.commands.executeCommand('kt5awar-player.focus').then(() => {
            console.log('kt5awar engine initialization triggered.');
        });
    }, 2000);
    const disposable = vscode.window.onDidEndTerminalShellExecution(async (event) => {
        const exitCode = event.exitCode;
        if (exitCode !== undefined && exitCode !== 0) {
            const config = vscode.workspace.getConfiguration('kt5awar');
            const enabled = config.get('enabled', true);
            if (enabled) {
                console.log(`Command failed with exit code ${exitCode}. Playing kt5awar sound...`);
                if (!soundProvider.isReady()) {
                    console.log('kt5awar engine not ready, attempting to re-initialize...');
                    vscode.commands.executeCommand('kt5awar-player.focus');
                    setTimeout(() => soundProvider.playSound(), 1000);
                }
                else {
                    soundProvider.playSound();
                }
            }
        }
    });
    context.subscriptions.push(disposable);
}
class SoundPlayerProvider {
    _extensionUri;
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'log':
                    console.log(`[Webview Log] ${message.text}`);
                    break;
                case 'error':
                    console.error(`[Webview Error] ${message.text}`);
                    break;
            }
        });
        console.log('Webview view resolved.');
    }
    isReady() {
        return !!this._view;
    }
    playSound() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'play' });
        }
        else {
            console.error('Sound player view not ready yet.');
        }
    }
    _getHtmlForWebview(webview) {
        const soundUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'kt5awar.wav'));
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sound Player</title>
    <style>
        body { padding: 10px; font-family: sans-serif; }
        button { 
            background: #007acc; color: white; border: none; 
            padding: 8px 12px; cursor: pointer; border-radius: 2px;
            font-size: 13px; margin-top: 10px;
        }
        button:hover { background: #0062a3; }
        .status { color: #888; font-size: 11px; margin-top: 5px; }
    </style>
</head>
<body>
    <div>Sound Engine 🔊</div>
    <button id="activate-btn">Click to Enable Audio</button>
    <div id="status" class="status">Waiting for interaction...</div>
    <audio id="error-audio" src="${soundUri}"></audio>
    <script>
        const vscode = acquireVsCodeApi();
        const audio = document.getElementById('error-audio');
        const btn = document.getElementById('activate-btn');
        const status = document.getElementById('status');

        btn.addEventListener('click', () => {
            // Unlocks audio on most browsers
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                btn.style.display = 'none';
                status.innerText = 'Audio System Enabled ✅';
                vscode.postMessage({ command: 'log', text: 'Audio unlocked by user interaction.' });
            }).catch(e => {
                vscode.postMessage({ command: 'error', text: 'Unlock failed: ' + e.message });
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'play') {
                audio.currentTime = 0;
                audio.play().then(() => {
                    vscode.postMessage({ command: 'log', text: 'Playback successful.' });
                }).catch(e => {
                    vscode.postMessage({ command: 'error', text: 'Playback failed: ' + e.message });
                });
            }
        });
        console.log('Sound engine script loaded.');
    </script>
</body>
</html>`;
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map