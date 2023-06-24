import typescript from '@rollup/plugin-typescript'

function configure(esm) {
    return {
        input: 'src/index.ts',
        plugins: [
            typescript({
                tsconfig: './tsconfig.build.json'
            }),
        ],
        output: esm
            ? { format: 'es', dir: 'dist', entryFileNames: 'wacky-ids.mjs', sourcemap: true }
            : {
                format: 'umd',
                name: 'genMapping',
                dir: 'dist',
                entryFileNames: 'wacky-ids.umd.js',
                sourcemap: true
            },
        context: 'globalThis',
        watch: {
            include: 'src/**',
        },
    };
}

export default [configure(false), configure(true)];