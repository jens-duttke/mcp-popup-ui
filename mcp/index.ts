#!/usr/bin/env node

/**
 * mcp-popup-ui
 *
 * An MCP server that provides interactive popup UI tools
 * for collecting user input via the system browser.
 */

import { startServer } from './server/index.js';

// Start the MCP server
try {
	await startServer();
}
catch (error) {
	console.error('Failed to start MCP server:', error);
	process.exit(1);
}
