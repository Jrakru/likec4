import { noopFileSystemWatcher } from './FileSystemWatcher';
export class NoopFileSystemProvider {
    scanProjectFiles() {
        return Promise.resolve([]);
    }
    readFile() {
        throw new Error('No file system is available.');
    }
    readDirectory() {
        return Promise.resolve([]);
    }
    loadProjectConfig() {
        throw new Error('No file system is available.');
    }
}
export const NoopFileSystem = {
    fileSystemProvider: () => new NoopFileSystemProvider(),
    ...noopFileSystemWatcher,
};
