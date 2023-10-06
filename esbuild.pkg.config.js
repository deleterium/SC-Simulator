const esbuild = require('esbuild')
esbuild.build({
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: false,
    platform: 'node',
    sourcemap: true,
    target: 'es2020'
}).catch(() => process.exit(1))
