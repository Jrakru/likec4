import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';
const mkdist = {
    input: './src/',
    outDir: './dist/',
    builder: 'mkdist',
    ext: 'mjs',
    addRelativeDeclarationExtensions: false,
    declaration: true,
    globOptions: {
        ignore: [
            'src/empty.ts',
            '**/*.langium',
            '**/__*/**',
            '**/*.spec.ts',
        ],
    },
};
const bundled = {
    input: './src/bundled.ts',
    name: 'bundled',
    builder: 'rollup',
    declaration: false,
};
export default defineBuildConfig({
    entries: [mkdist, bundled],
    clean: true,
    stub: false,
    alias: {
        'raw-body': resolve('./src/empty.ts'),
        'content-type': resolve('./src/empty.ts'),
    },
    rollup: {
        esbuild: {
            minify: true,
            minifyIdentifiers: false,
            lineLimit: 500,
        },
        inlineDependencies: true,
        resolve: {
            exportConditions: ['node', 'sources'],
        },
    },
});
