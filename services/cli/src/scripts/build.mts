import esbuild from 'esbuild';

const main = async () => {
  await esbuild.build({
    bundle: true,
    minify: true,
    sourcemap: true,
    entryPoints: ['./src/webapp/index.tsx'],
    outfile: './dist/public/index.js',
    logLevel: 'info',
    platform: 'browser',
    define: {
      'process.env.REACT_APP_API_URL': '"/api"',
      'process.env.REACT_APP_API_WS': '"/ws"',
    },
  });
  await esbuild.build({
    entryPoints: ['./src/index.ts'],
    platform: 'node',
    outfile: './dist/index.js',
    logLevel: 'info',
    format: 'cjs',
  });
};
main();
