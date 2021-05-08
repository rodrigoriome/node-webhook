import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';

/** @returns {import('rollup').RollupOptions} */
const mapRollupEntries = entryFile => {
    return {
        input: entryFile,
        output: {
            name: entryFile,
            dir: 'dist',
            format: 'commonjs'
        },
        plugins: [
            typescript({
                useTsconfigDeclarationDir: true
            }),
            terser(),
            nodeResolve(),
        ]
    }
}

export default [
    'src/index.ts',
    'src/cli.ts'
].map(mapRollupEntries)
