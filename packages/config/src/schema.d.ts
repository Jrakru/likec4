import type { DeploymentElementModel, DeploymentRelationModel, ElementModel, LikeC4Model, LikeC4ViewModel, RelationshipModel } from '@likec4/core/model';
import type { aux, ProjectId } from '@likec4/core/types';
import type { SimplifyDeep } from 'type-fest';
import type { URI } from 'vscode-uri';
import * as z from 'zod/v4';
export declare const LikeC4ExperimentalConfigSchema: any;
export declare const LikeC4ProjectJsonConfigSchema: any;
export type LikeC4ProjectJsonConfig = SimplifyDeep<z.input<typeof LikeC4ProjectJsonConfigSchema>>;
export declare const GeneratorsSchema: any;
export declare const LikeC4ProjectConfigSchema: any;
export interface GeneratorFnContext {
    /**
     * Workspace root directory
     */
    readonly workspace: URI;
    /**
     * Current project
     */
    readonly project: {
        /**
         * Project name
         */
        readonly id: ProjectId;
        readonly title?: string;
        /**
         * Project folder
         */
        readonly folder: URI;
    };
    /**
     * Returns the location of the specified element, relation, view or deployment element
     */
    locate(target: ElementModel | RelationshipModel | DeploymentRelationModel | LikeC4ViewModel | DeploymentElementModel): {
        /**
         * Range inside the source file
         */
        range: {
            start: {
                line: number;
                character: number;
            };
            end: {
                line: number;
                character: number;
            };
        };
        /**
         * Full path to the source file
         */
        document: URI;
        /**
         * Document path relative to the project folder
         */
        relativePath: string;
        /**
         * Folder, containing the source file ("dirname" of document)
         */
        folder: string;
        /**
         * Source file name ("basename" of document)
         */
        filename: string;
    };
    /**
     * Write a file
     * @param path - Path to the file, either absolute or relative to the project folder
     *               All folders will be created automatically
     * @param content - Content of the file
     */
    write(file: {
        path: string | string[] | URI;
        content: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | NodeJS.ReadableStream;
    }): Promise<void>;
    /**
     * Abort the process
     */
    abort(reason?: string): never;
}
export type GeneratorFnParams = {
    /**
     * LikeC4 model
     */
    likec4model: LikeC4Model<aux.UnknownLayouted>;
    /**
     * Generator context
     */
    ctx: GeneratorFnContext;
};
export interface GeneratorFn {
    (params: GeneratorFnParams): Promise<void> | void;
}
/**
 * LikeC4 project configuration
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   name: 'my-project',
 *   generators: {
 *     'my-generator': async ({ likec4model, ctx }) => {
 *       await ctx.write('my-generator.txt', likec4model.project.id)
 *     }
 *   }
 * })
 * ```
 */
export type LikeC4ProjectConfig = z.infer<typeof LikeC4ProjectJsonConfigSchema> & {
    /**
     * Add custom generators to the project
     * @example
     * ```ts
     * export default defineConfig({
     *   name: 'my-project',
     *   generators: {
     *     'my-generator': async ({ likec4model, ctx }) => {
     *       await ctx.write('my-generator.txt', likec4model.project.id)
     *     }
     *   }
     * })
     * ```
     *
     * Execute generator:
     * ```bash
     * likec4 gen my-generator
     * ```
     */
    generators?: Record<string, GeneratorFn> | undefined;
};
export type LikeC4ProjectConfigInput = SimplifyDeep<z.input<typeof LikeC4ProjectJsonConfigSchema> & {
    generators?: Record<string, GeneratorFn> | undefined;
}>;
/**
 * Validates JSON string or JSON object into a LikeC4ProjectConfig object.
 */
export declare function validateProjectConfig<C extends string | Record<string, unknown>>(config: C): LikeC4ProjectConfig;
/**
 * Converts a LikeC4ProjectConfig object into a LikeC4ProjectJsonConfig object.
 * Omit generators property (as it is not serializable)
 */
export declare function serializableLikeC4ProjectConfig({ generators: _, // omit
...config }: LikeC4ProjectConfig): LikeC4ProjectJsonConfig;
//# sourceMappingURL=schema.d.ts.map