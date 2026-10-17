// Tests set globalThis.__platform to exercise the native or web branch.
export const Platform = {
  get OS() {
    return globalThis.__platform ?? 'ios';
  },
};
