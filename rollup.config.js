import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

/** @returns {import('rollup').RollupOptions} */
const mapRollupEntries = entryFile => {
    return {
        input: entryFile,
        output: {
            name: entryFile,
            dir: 'dist',
            format: 'cjs'
        },
        plugins: [
            typescript({
                abortOnError: false,
                useTsconfigDeclarationDir: true
            }),
            terser(),
        ]
    }
}

export default [
    'src/index.ts',
    'src/cli.ts'
].map(mapRollupEntries)
