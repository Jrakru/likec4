import { type AstNode } from 'langium';
import { type LikeC4LangiumDocument } from '../ast';
import type { LikeC4Services } from '../module';
export { LikeC4DocumentValidator } from './DocumentValidator';
type Guard<N extends AstNode> = (n: AstNode) => n is N;
type Guarded<G> = G extends Guard<infer N> ? N : never;
declare const isValidatableAstNode: (n: AstNode) => n is any;
type ValidatableAstNode = Guarded<typeof isValidatableAstNode>;
export declare function checksFromDiagnostics(doc: LikeC4LangiumDocument): {
    isValid: (n: ValidatableAstNode) => boolean;
    invalidNodes: WeakSet<object>;
};
export type ChecksFromDiagnostics = ReturnType<typeof checksFromDiagnostics>;
export type IsValidFn = ChecksFromDiagnostics['isValid'];
/**
 * Register validation check factories with the Langium ValidationRegistry and set up flushing of diagnostics for deleted documents.
 *
 * Registers a mapping from LikeC4 AST types to their corresponding validation check factories and, if an LSP connection is available,
 * schedules a DocumentBuilder update handler that clears diagnostics for documents removed from the workspace.
 *
 * @param services - The LikeC4 language services container used to obtain the ValidationRegistry, workspace DocumentBuilder, and optional LSP connection
 */
export declare function registerValidationChecks(services: LikeC4Services): void;
