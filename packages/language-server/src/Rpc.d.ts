import type { LikeC4Services } from './module';
import { DidRequestOpenViewNotification } from './protocol';
import { ADisposable } from './utils';
export declare class Rpc extends ADisposable {
    private services;
    constructor(services: LikeC4Services);
    init(): void;
    openView(params: DidRequestOpenViewNotification.Params): Promise<void>;
}
