/**
 * MCP Server setup and configuration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import {
	askUserDefinition,
	executeAskUser,
	askUserMultipleDefinition,
	executeAskUserMultiple
} from '../tools/index.js';
import type { SelectSingleInput, SelectMultipleInput } from '../types/index.js';

// ============================================================================
// Type Guards for MCP Tool Arguments
// ============================================================================

/**
 * Type guard for SelectSingleInput
 */
function isSelectSingleInput (value: unknown): value is SelectSingleInput {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	// options is optional but if present must be an array
	if ('options' in value && !Array.isArray(value.options)) {
		return false;
	}

	// Optional string fields
	if ('title' in value && typeof value.title !== 'string') {
		return false;
	}

	if ('description' in value && typeof value.description !== 'string') {
		return false;
	}

	return true;
}

/**
 * Type guard for SelectMultipleInput
 */
function isSelectMultipleInput (value: unknown): value is SelectMultipleInput {
	// Same structure as SelectSingleInput
	return isSelectSingleInput(value);
}

/**
 * Creates and configures the MCP server
 */
export function createServer (): McpServer {
	const mcpServer = new McpServer(
		{
			name: 'mcp-popup-ui',
			version: '0.1.0'
		},
		{
			capabilities: {
				tools: {}
			}
		}
	);

	// Register tool listing handler using the underlying Server
	mcpServer.server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [
			askUserDefinition,
			askUserMultipleDefinition
		]
	}));

	// Register tool execution handler using the underlying Server
	mcpServer.server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		try {
			switch (name) {
				case 'ask_user': {
					if (!isSelectSingleInput(args)) {
						throw new Error('Invalid arguments for ask_user tool');
					}

					const result = await executeAskUser(args);

					const textContent = (result.action === 'submit' ?
            `User selected: ${result.selection}`
            : 'User skipped the selection');

					return {
						content: [
							{
								type: 'text',
								text: textContent
							}
						],
						structuredContent: result
					};
				}

				case 'ask_user_multiple': {
					if (!isSelectMultipleInput(args)) {
						throw new Error('Invalid arguments for ask_user_multiple tool');
					}

					const result = await executeAskUserMultiple(args);

					const textContent = (result.action === 'submit' ?
            `User selected: ${result.selections?.join(', ')}`
            : 'User skipped the selection');

					return {
						content: [
							{
								type: 'text',
								text: textContent
							}
						],
						structuredContent: result
					};
				}

				default:
					throw new Error(`Unknown tool: ${name}`);
			}
		}
		catch (error) {
			const errorMessage = (error instanceof Error ? error.message : 'Unknown error');

			return {
				content: [
					{
						type: 'text',
						text: `Error: ${errorMessage}`
					}
				],
				isError: true
			};
		}
	});

	return mcpServer;
}

/**
 * Starts the server with stdio transport
 */
export async function startServer (): Promise<void> {
	const server = createServer();
	const transport = new StdioServerTransport();

	await server.connect(transport);

	// Handle graceful shutdown
	process.on('SIGINT', async () => {
		await server.close();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		await server.close();
		process.exit(0);
	});
}
