/**
 * Test server for the production build
 * Starts the HTTP server with mock form configuration
 *
 * Usage: node scripts/test-server.mjs
 */

import { serveFormAndAwaitResponse } from '../dist/http/index.js';

/**
 * Mock form configuration for testing
 */
const mockConfig = {
	title: 'Test: Select an Option',
	description: 'This is a test of the production build. Select one option below.',
	field: {
		type: 'radio',
		name: 'selection',
		options: [
			{ label: 'Option A', description: 'First option with some details' },
			{ label: 'Option B', description: 'Second option with other details' },
			{ label: 'Option C' }
		],
		allowOther: true,
		otherLabel: 'Custom option'
	}
};

console.log('Starting test server with mock configuration...');
console.log('Browser will open automatically.\n');

try {
	const response = await serveFormAndAwaitResponse(mockConfig);

	console.log('\n✅ Response received:');
	console.log(JSON.stringify(response, null, 2));
}
catch (error) {
	console.error('\n❌ Error:', error.message);
	process.exit(1);
}
