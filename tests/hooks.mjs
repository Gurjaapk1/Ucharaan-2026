import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STUBS = {
  'react-native': 'react-native.mjs',
  'expo-audio': 'expo-audio.mjs',
  'expo-file-system': 'expo-file-system.mjs',
};

export async function resolve(specifier, context, next) {
  if (STUBS[specifier]) {
    return { url: new URL(`./stubs/${STUBS[specifier]}`, import.meta.url).href, shortCircuit: true };
  }
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    for (const ext of ['', '.ts', '.tsx']) {
      if (ext === '' && !/\.(json|ts|tsx|mjs|js)$/.test(base)) continue;
      if (existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    return { format: 'module', source: `export default ${readFileSync(fileURLToPath(url), 'utf8')};`, shortCircuit: true };
  }
  // The app's sources are ES modules; say so rather than let Node guess.
  if (/\.tsx?$/.test(url)) return next(url, { ...context, format: 'module-typescript' });
  return next(url, context);
}
