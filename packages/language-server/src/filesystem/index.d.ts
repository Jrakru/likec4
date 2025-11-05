import type { LikeC4ProjectConfig } from '@likec4/config';
import type { FileSystemNode, FileSystemProvider as LangiumFileSystemProvider, LangiumSharedCoreServices } from 'langium';
import { URI } from 'vscode-uri';
import { type FileSystemWatcherModuleContext } from './FileSystemWatcher';
export type { FileSystemWatcher } from './FileSystemWatcher';
export interface FileSystemProvider extends LangiumFileSystemProvider {
    /**
     * Scans the project files for the given URI.
     * @returns The list of file system entries that are contained within the specified directory.
     */
    scanProjectFiles(folderUri: URI): Promise<FileSystemNode[]>;
    /**
     * Loads the project config from the given file.
     * @returns The project config.
     */
    loadProjectConfig(filepath: URI): Promise<LikeC4ProjectConfig>;
}
export interface FileSystemModuleContext extends FileSystemWatcherModuleContext {
    fileSystemProvider: (services: LangiumSharedCoreServices) => FileSystemProvider;
}
export declare class NoopFileSystemProvider implements FileSystemProvider {
    scanProjectFiles(): Promise<FileSystemNode[]>;
    readFile(): Promise<string>;
    readDirectory(): Promise<FileSystemNode[]>;
    loadProjectConfig(): Promise<LikeC4ProjectConfig>;
}
export declare const NoopFileSystem: FileSystemModuleContext;
