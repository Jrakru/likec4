import JSON5 from 'json5';
import * as z from 'zod/v4';
import { ImageAliasesSchema, validateImageAliases } from './schema.image-alias';
import { LikeC4StylesConfigSchema } from './schema.theme';
export const LikeC4ExperimentalConfigSchema = z.object({
    dynamicBranchCollections: z.boolean()
        .optional()
        .meta({
        description: 'Enable experimental branch collections in dynamic views. Allows branching (parallel/alternate paths) in sequence diagrams.',
    }),
})
    .optional()
    .meta({
    description: 'Experimental features that may change or be removed in future versions',
});
export const LikeC4ProjectJsonConfigSchema = z.object({
    name: z.string()
        .nonempty('Project name cannot be empty')
        .refine((value) => value !== 'default', {
        abort: true,
        error: 'Project name cannot be "default"',
    })
        .refine((value) => !value.includes('.') && !value.includes('@') && !value.includes('#'), {
        abort: true,
        error: 'Project name cannot contain ".", "@" or "#", try to use A-z, 0-9, _ and -',
    })
        .meta({ description: 'Project name, must be unique in the workspace' }),
    title: z.string()
        .nonempty('Project title cannot be empty if specified')
        .optional()
        .meta({ description: 'A human readable title for the project' }),
    contactPerson: z.string()
        .nonempty('Contact person cannot be empty if specified')
        .optional()
        .meta({ description: 'A person who has been involved in creating or maintaining this project' }),
    imageAliases: ImageAliasesSchema
        .optional(),
    styles: LikeC4StylesConfigSchema
        .optional(),
    experimental: LikeC4ExperimentalConfigSchema,
    exclude: z.array(z.string())
        .optional()
        .meta({ description: 'List of file patterns to exclude from the project, default is ["**/node_modules/**"]' }),
})
    .meta({
    description: 'LikeC4 project configuration',
});
const FunctionType = z.instanceof(Function);
export const GeneratorsSchema = z.record(z.string(), FunctionType);
export const LikeC4ProjectConfigSchema = LikeC4ProjectJsonConfigSchema.extend({
    generators: GeneratorsSchema.optional(),
});
/**
 * Validates JSON string or JSON object into a LikeC4ProjectConfig object.
 */
export function validateProjectConfig(config) {
    const parsed = LikeC4ProjectConfigSchema.safeParse(typeof config === 'string' ? JSON5.parse(config) : config);
    if (!parsed.success) {
        throw new Error('Config validation failed:\n' + z.prettifyError(parsed.error));
    }
    // TODO: rewrite with zod refine
    if (parsed.data.imageAliases) {
        validateImageAliases(parsed.data.imageAliases);
    }
    return parsed.data;
}
/**
 * Converts a LikeC4ProjectConfig object into a LikeC4ProjectJsonConfig object.
 * Omit generators property (as it is not serializable)
 */
export function serializableLikeC4ProjectConfig({ generators: _, // omit
...config }) {
    return LikeC4ProjectJsonConfigSchema.parse(config);
}
