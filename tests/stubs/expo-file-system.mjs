// A file whose write runs the test's hook, so a test can act mid-write.
export const Paths = { cache: 'cache' };
export class File {
  constructor(dir, name) {
    this.uri = `file:///${dir}/${name}`;
    this.exists = true;
  }
  create() {}
  async write(bytes) {
    await globalThis.__onFileWrite?.(bytes);
  }
}
