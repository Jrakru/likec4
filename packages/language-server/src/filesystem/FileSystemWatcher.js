export const noopFileSystemWatcher = {
    fileSystemWatcher: () => new NoopFileSystemWatcher(),
};
/**
 * A no-op file system watcher.
 */
export class NoopFileSystemWatcher {
    watch() {
        return;
    }
    dispose() {
        return Promise.resolve();
    }
}
