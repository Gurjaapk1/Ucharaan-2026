// Lets `node --test` load the app's TypeScript: Node 24 strips the types,
// this resolves extensionless imports and swaps native modules for stubs.
import { register } from 'node:module';

register('./hooks.mjs', import.meta.url);
