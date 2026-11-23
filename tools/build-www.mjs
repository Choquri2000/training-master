// Copies the web app (repo root, also served by GitHub Pages) into www/ for the Android build.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const KEEP = ['index.html', 'privacy.html', 'terms.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons', 'assets', 'vendor', 'voice'];
rmSync('www', { recursive: true, force: true }); mkdirSync('www');
for (const f of KEEP) cpSync(f, `www/${f}`, { recursive: true });
console.log('www ready');
