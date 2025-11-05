import { LikeC4Model } from '@likec4/core/model';
import { type aux } from '@likec4/core/types';
import { QueueGraphvizLayoter } from './QueueGraphvizLayoter';
/**
 * Layouts all views in the computed model.
 * @param model - The model to layout.
 * @param options - Options for the layouter.
 * @returns A promise that resolves to the layouted model.
 */
export declare function layoutLikeC4Model<A extends aux.Any>(model: LikeC4Model<A>, options?: ConstructorParameters<typeof QueueGraphvizLayoter>[0]): Promise<LikeC4Model.Layouted<A>>;
