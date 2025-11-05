import { isLikeC4Config } from '@likec4/config/node';
import { loggable } from '@likec4/log';
import chokidar from 'chokidar';
import { URI } from 'langium';
import { logger as mainLogger } from '../logger';
import { isAnyLikeC4File, isLikeC4File } from './LikeC4FileSystem';
const logger = mainLogger.getChild('chokidar');
export const chokidarFileSystemWatcher = {
    fileSystemWatcher: (services) => new ChokidarFileSystemWatcher(services),
};
/**
 * A no-op file system watcher.
 */
export class ChokidarFileSystemWatcher {
    services;
    watcher;
    constructor(services) {
        this.services = services;
    }
    watch(folder) {
        if (this.watcher) {
            this.watcher.add(folder);
        }
        else {
            this.watcher = this.createWatcher(folder);
        }
        logger.debug `watching folder: ${folder}`;
    }
    async dispose() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = undefined;
        }
        return;
    }
    createWatcher(folder) {
        let watcher = chokidar.watch(folder, {
            ignored: [
                path => path.includes('node_modules') || path.includes('.git'),
                (path, stats) => (!!stats && stats.isFile() && !isAnyLikeC4File(path)),
            ],
            ignoreInitial: true,
        });
        const onAddOrChange = async (path) => {
            try {
                if (isLikeC4Config(path)) {
                    logger.debug `project file changed: ${path}`;
                    await this.services.workspace.ProjectsManager.reloadProjects();
                }
                else if (isLikeC4File(path)) {
                    logger.debug `file changed: ${path}`;
                    await this.services.workspace.DocumentBuilder.update([URI.file(path)], []);
                }
            }
            catch (error) {
                logger.error(loggable(error));
            }
        };
        const onRemove = async (path) => {
            try {
                if (isLikeC4Config(path)) {
                    logger.debug `project file removed: ${path}`;
                    await this.services.workspace.ProjectsManager.reloadProjects();
                }
                else if (isLikeC4File(path)) {
                    logger.debug `file removed: ${path}`;
                    await this.services.workspace.DocumentBuilder.update([], [URI.file(path)]);
                }
            }
            catch (error) {
                logger.error(loggable(error));
            }
        };
        watcher.on('add', onAddOrChange)
            .on('change', onAddOrChange)
            .on('unlink', onRemove);
        return watcher;
    }
}
