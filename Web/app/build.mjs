import { build } from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, readFile, writeFile, rm, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const assetsDir = path.join(distDir, 'assets');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

async function resolveAliasedPath(rawPath) {
  const absolute = path.isAbsolute(rawPath) ? rawPath : path.join(srcDir, rawPath);

  try {
    await access(absolute);
    return absolute;
  } catch {}

  for (const ext of EXTENSIONS) {
    try {
      await access(`${absolute}${ext}`);
      return `${absolute}${ext}`;
    } catch {}
  }

  for (const ext of EXTENSIONS) {
    const indexPath = path.join(absolute, `index${ext}`);
    try {
      await access(indexPath);
      return indexPath;
    } catch {}
  }

  return absolute;
}

await rm(distDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

const cssInput = await readFile(path.join(srcDir, 'index.css'), 'utf8');
const cssResult = await postcss([tailwindcss(), autoprefixer()]).process(cssInput, {
  from: path.join(srcDir, 'index.css'),
  to: path.join(assetsDir, 'index.css'),
});
await writeFile(path.join(assetsDir, 'index.css'), cssResult.css);

await build({
  entryPoints: [path.join(srcDir, 'main.tsx')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  outfile: path.join(assetsDir, 'index.js'),
  sourcemap: false,
  minify: true,
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{
    name: 'alias-at',
    setup(build) {
      build.onResolve({ filter: /^@\// }, async args => ({
        path: await resolveAliasedPath(args.path.slice(2)),
      }));
    },
  }],
});

const html = await readFile(path.join(root, 'index.html'), 'utf8');
const injected = html.replace('</head>', '    <link rel="stylesheet" href="/assets/index.css" />\n  </head>')
  .replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/assets/index.js"></script>');
await writeFile(path.join(distDir, 'index.html'), injected);

const favicon = path.join(root, 'public', 'favicon.ico');
try {
  await copyFile(favicon, path.join(distDir, 'favicon.ico'));
} catch {}

console.log('Build complete');
