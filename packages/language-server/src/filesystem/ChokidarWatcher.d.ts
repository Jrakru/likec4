import type { LikeC4SharedServices } from '../module';
import type { FileSystemWatcher, FileSystemWatcherModuleContext } from './FileSystemWatcher';
export declare const chokidarFileSystemWatcher: FileSystemWatcherModuleContext;
/**
 * A no-op file system watcher.
 */
export declare class ChokidarFileSystemWatcher implements FileSystemWatcher {
    protected services: LikeC4SharedServices;
    private watcher?;
    constructor(services: LikeC4SharedServices);
    watch(folder: string): void;
    dispose(): Promise<void>;
    private createWatcher;
}
