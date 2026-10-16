// React Native Web's Animated implementation expects the native `global` alias.
// Keep this browser compatibility shim out of the shared native feature folder.
if (!('global' in globalThis)) {
  Object.defineProperty(globalThis, 'global', {value: globalThis, configurable: true});
}
