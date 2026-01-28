/**
 * Ephemeral HTTP server for serving React app and collecting responses
 */

import { exec } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { platform, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FormConfig, FormResponse } from '../types/index.js';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid FormResponse
 */
function isFormResponse (value: unknown): value is FormResponse {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return (
		'action' in value &&
		typeof value.action === 'string' &&
		['submit', 'skip', 'request_explanation'].includes(value.action) &&
		(!('data' in value) || typeof value.data === 'object')
	);
}

/**
 * Type guard to check if server.address() returned AddressInfo
 */
function isAddressInfo (value: ReturnType<http.Server['address']>): value is AddressInfo {
	return (value !== null && typeof value === 'object' && 'port' in value);
}

// Path to the built React app (dist/frontend when running from dist/http/)
const FRONTEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend');

/** MIME types for static file serving */
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon'
};

/**
 * Serves a static file from the frontend directory
 */
function serveStaticFile (filePath: string, res: http.ServerResponse): boolean {
	const fullPath = path.join(FRONTEND_DIR, filePath);
	const safePath = path.normalize(fullPath);

	// Prevent directory traversal
	if (!safePath.startsWith(FRONTEND_DIR)) {
		return false;
	}

	try {
		if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
			return false;
		}

		const extension = path.extname(safePath);
		const contentType = (MIME_TYPES[extension] || 'application/octet-stream');
		const content = fs.readFileSync(safePath);

		res.writeHead(200, {
			'Content-Type': contentType,
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		});
		res.end(content);

		return true;
	}
	catch {
		return false;
	}
}

/**
 * Creates a skip response for when the browser is closed without interaction
 */
function createSkipResponse (): FormResponse {
	return { action: 'skip', data: {} };
}

/**
 * Finds an available port and starts an HTTP server
 * Returns a promise that resolves when the user submits or skips
 */
export async function serveFormAndAwaitResponse (config: FormConfig): Promise<FormResponse> {
	return new Promise((resolve, reject) => {
		let resolved = false;
		let sseConnection: http.ServerResponse | null = null;

		/**
		 * Resolves with skip response and cleans up
		 */
		function resolveWithSkip (server: http.Server): void {
			if (!resolved) {
				resolved = true;
				server.close();
				resolve(createSkipResponse());
			}
		}

		const server = http.createServer((request, res) => {
			const url = new URL((request.url ?? '/'), `http://${request.headers.host}`);

			// Enable CORS for local development
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

			if (request.method === 'OPTIONS') {
				res.writeHead(204);
				res.end();

				return;
			}

			// API: SSE connection for detecting browser close
			if (request.method === 'GET' && url.pathname === '/api/connection') {
				// Close any existing SSE connection (shouldn't happen, but be safe)
				if (sseConnection) {
					sseConnection.end();
				}

				sseConnection = res;

				res.writeHead(200, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				});

				// Send initial connected event
				res.write('event: connected\ndata: {}\n\n');

				// Keep connection alive with periodic heartbeats
				const heartbeatInterval = setInterval(() => {
					if (!res.writableEnded) {
						res.write('event: heartbeat\ndata: {}\n\n');
					}
				}, 5000);

				// When connection closes (browser window closed), resolve with skip
				res.on('close', () => {
					clearInterval(heartbeatInterval);
					sseConnection = null;
					resolveWithSkip(server);
				});

				return;
			}

			// API: Get form configuration
			if (request.method === 'GET' && url.pathname === '/api/config') {
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify(config));

				return;
			}

			// API: Submit form response
			if (request.method === 'POST' && url.pathname === '/api/submit') {
				let body = '';

				request.on('data', (chunk: Buffer) => {
					body += chunk.toString();
				});

				request.on('end', () => {
					try {
						const parsed: unknown = JSON.parse(body);

						if (!isFormResponse(parsed)) {
							res.writeHead(400, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ error: 'Invalid form response' }));

							return;
						}

						const data = parsed;

						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ success: true }));

						if (!resolved) {
							resolved = true;

							// Close the server after a short delay to ensure response is sent
							setTimeout(() => {
								server.close();
								resolve(data);
							}, 100);
						}
					}
					catch {
						res.writeHead(400, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ error: 'Invalid JSON' }));
					}
				});

				request.on('error', (error: Error) => {
					if (!resolved) {
						resolved = true;
						server.close();
						reject(error);
					}
				});

				return;
			}

			// Static files: Serve from frontend build directory
			if (request.method === 'GET') {
				// Try the exact path first
				const filePath = (url.pathname === '/' ? '/index.html' : url.pathname);

				if (serveStaticFile(filePath, res)) {
					return;
				}

				// SPA fallback: serve index.html for unknown routes
				if (serveStaticFile('/index.html', res)) {
					return;
				}

				res.writeHead(404, { 'Content-Type': 'text/plain' });
				res.end('Not Found');

				return;
			}

			// Method not allowed
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Method Not Allowed');
		});

		server.on('error', (error: Error) => {
			if (!resolved) {
				resolved = true;
				reject(error);
			}
		});

		// Listen on a random available port
		server.listen(0, '127.0.0.1', () => {
			const address = server.address();

			if (!isAddressInfo(address)) {
				reject(new Error('Failed to get server address'));

				return;
			}

			const url = `http://127.0.0.1:${address.port}`;

			// Open the browser - if it fails, resolve with skip
			openBrowser(url).catch((error: unknown) => {
				console.error('Failed to open browser:', error);
				resolveWithSkip(server);
			});
		});
	});
}

/** Default window size for app mode */
const APP_WINDOW_WIDTH = 500;
const APP_WINDOW_HEIGHT = 600;

/**
 * Gets screen dimensions for centering the window.
 * Returns null if unable to determine.
 */
async function getScreenSize (): Promise<{ width: number; height: number; } | null> {
	const os = platform();

	return new Promise((resolve) => {
		if (os === 'win32') {
			// PowerShell command to get primary screen resolution (JSON output for reliable parsing)
			const cmd = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds | Select-Object Width,Height | ConvertTo-Json"';

			exec(cmd, (error, stdout) => {
				if (error) {
					resolve(null);

					return;
				}

				try {
					const parsed: unknown = JSON.parse(stdout.trim());

					if (
						typeof parsed === 'object' &&
						parsed !== null &&
						'Width' in parsed &&
						'Height' in parsed &&
						typeof parsed.Width === 'number' &&
						typeof parsed.Height === 'number'
					) {
						resolve({ width: parsed.Width, height: parsed.Height });
					}
					else {
						resolve(null);
					}
				}
				catch {
					resolve(null);
				}
			});
		}
		else if (os === 'darwin') {
			exec('system_profiler SPDisplaysDataType | grep Resolution', (error, stdout) => {
				if (error) {
					resolve(null);

					return;
				}

				const match = (/(\d+)\s*x\s*(\d+)/u).exec(stdout);

				if (match) {
					resolve({ width: Number.parseInt(match[1], 10), height: Number.parseInt(match[2], 10) });
				}
				else {
					resolve(null);
				}
			});
		}
		else {
			exec('xdpyinfo | grep dimensions', (error, stdout) => {
				if (error) {
					resolve(null);

					return;
				}

				const match = (/(\d+)x(\d+)/u).exec(stdout);

				if (match) {
					resolve({ width: Number.parseInt(match[1], 10), height: Number.parseInt(match[2], 10) });
				}
				else {
					resolve(null);
				}
			});
		}
	});
}

/**
 * Opens browser in app mode (no address bar, tabs, etc.)
 * Uses Edge on Windows (pre-installed), Chrome as fallback.
 * Falls back to default browser if no app-mode browser is available.
 */
async function openBrowser (url: string): Promise<void> {
	const os = platform();

	// Try to get screen size for centering
	const screen = await getScreenSize();
	const windowSizeArg = `"--window-size=${APP_WINDOW_WIDTH},${APP_WINDOW_HEIGHT}"`;
	let windowPosArg = '';

	if (screen) {
		const x = Math.round((screen.width - APP_WINDOW_WIDTH) / 2);
		const y = Math.round((screen.height - APP_WINDOW_HEIGHT) / 2);

		windowPosArg = ` "--window-position=${x},${y}"`;
	}

	if (os === 'win32') {
		// Windows: try Edge first (pre-installed), then Chrome
		// Use --user-data-dir to force a new browser instance (otherwise window args are ignored)
		const tempDir = tmpdir();
		const userDataDir = `${tempDir}\\mcp-popup-${Date.now()}`;
		const browsers = [
			`start "" msedge "--app=${url}" ${windowSizeArg}${windowPosArg} "--user-data-dir=${userDataDir}"`,
			`start "" chrome "--app=${url}" ${windowSizeArg}${windowPosArg} "--user-data-dir=${userDataDir}"`
		];

		for (const cmd of browsers) {
			const success = await new Promise<boolean>((resolve) => {
				exec(cmd, (error) => {
					resolve(!error);
				});
			});

			if (success) {
				return;
			}
		}
	}
	else if (os === 'darwin') {
		// macOS: use open command with Chrome/Edge
		const windowArgs = `--window-size=${APP_WINDOW_WIDTH},${APP_WINDOW_HEIGHT}${windowPosArg.replace(/"/gu, '')}`;
		const browsers = [
			['Google Chrome', `--args --app="${url}" ${windowArgs} --new-window`],
			['Microsoft Edge', `--args --app="${url}" ${windowArgs} --new-window`]
		];

		for (const [app, args] of browsers) {
			const success = await new Promise<boolean>((resolve) => {
				exec(`open -a "${app}" ${args}`, (error) => {
					resolve(!error);
				});
			});

			if (success) {
				return;
			}
		}
	}
	else {
		// Linux: try common browser commands
		const windowArgs = `--window-size=${APP_WINDOW_WIDTH},${APP_WINDOW_HEIGHT}${windowPosArg.replace(/"/gu, '')}`;
		const browsers = [
			`google-chrome --app="${url}" ${windowArgs} --new-window`,
			`chromium-browser --app="${url}" ${windowArgs} --new-window`,
			`microsoft-edge --app="${url}" ${windowArgs} --new-window`
		];

		for (const cmd of browsers) {
			const success = await new Promise<boolean>((resolve) => {
				exec(cmd, (error) => {
					resolve(!error);
				});
			});

			if (success) {
				return;
			}
		}
	}

	// Fallback: use 'open' package for default browser
	const open = await import('open');

	await open.default(url);
}

/**
 * Gets the URL for the form server (for testing purposes)
 */
export function getServerUrl (server: http.Server): string {
	const address = server.address();

	if (!isAddressInfo(address)) {
		throw new Error('Server is not listening or address is unavailable');
	}

	return `http://127.0.0.1:${address.port}`;
}
