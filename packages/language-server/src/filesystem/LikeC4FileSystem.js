import { isLikeC4Config, loadConfig } from '@likec4/config/node';
import { fdir } from 'fdir';
import { URI } from 'langium';
import { NodeFileSystemProvider } from 'langium/node';
import { LikeC4LanguageMetaData } from '../generated/module';
import { Content, isLikeC4Builtin } from '../likec4lib';
import { logger as rootLogger } from '../logger';
import { chokidarFileSystemWatcher } from './ChokidarWatcher';
import { noopFileSystemWatcher } from './FileSystemWatcher';
const logger = rootLogger.getChild('filesystem');
export const LikeC4FileSystem = (ehableWatcher = true) => ({
    fileSystemProvider: () => new SymLinkTraversingFileSystemProvider(),
    ...ehableWatcher ? chokidarFileSystemWatcher : noopFileSystemWatcher,
});
export const isLikeC4File = (path) => LikeC4LanguageMetaData.fileExtensions.some((ext) => path.endsWith(ext));
export const isAnyLikeC4File = (path) => isLikeC4File(path) || isLikeC4Config(path);
/**
 * A file system provider that follows symbolic links.
 * @see https://github.com/likec4/likec4/pull/1213
 */
class SymLinkTraversingFileSystemProvider extends NodeFileSystemProvider {
    async readFile(uri) {
        if (isLikeC4Builtin(uri)) {
            return Promise.resolve(Content);
        }
        try {
            return await super.readFile(uri);
        }
        catch (error) {
            logger.error(`Failed to read file ${uri.fsPath}`, { error });
            return '';
        }
    }
    async readDirectory(folderPath) {
        const entries = [];
        try {
            const crawled = await new fdir()
                .withSymlinks({ resolvePaths: false })
                .withFullPaths()
                .filter(isLikeC4File)
                .crawl(folderPath.fsPath)
                .withPromise();
            for (const path of crawled) {
                entries.push({
                    isFile: true,
                    isDirectory: false,
                    uri: URI.file(path),
                });
            }
        }
        catch (error) {
            logger.error(`Failed to read directory ${folderPath.fsPath}`, { error });
        }
        return entries;
    }
    async scanProjectFiles(folderUri) {
        const entries = [];
        try {
            const crawled = await new fdir()
                .withSymlinks({ resolvePaths: false })
                .withFullPaths()
                .filter(isLikeC4Config)
                .crawl(folderUri.fsPath)
                .withPromise();
            for (const path of crawled) {
                entries.push({
                    isFile: true,
                    isDirectory: false,
                    uri: URI.file(path),
                });
            }
        }
        catch (error) {
            logger.error(`Failed to scan project files ${folderUri.fsPath}`, { error });
        }
        return entries;
    }
    async loadProjectConfig(filepath) {
        return await loadConfig(filepath);
    }
}
