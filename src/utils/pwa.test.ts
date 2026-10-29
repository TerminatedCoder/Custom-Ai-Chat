import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Web App Manifest and PWA icon assets exist and are valid', () => {
  const publicDir = path.resolve('public');
  const iconSvg = path.join(publicDir, 'icon.svg');
  const iconMaskable = path.join(publicDir, 'icon-maskable.svg');
  const pwa192 = path.join(publicDir, 'pwa-192x192.png');
  const pwa512 = path.join(publicDir, 'pwa-512x512.png');
  const pwaMaskable = path.join(publicDir, 'pwa-maskable-512x512.png');
  const appleTouchIcon = path.join(publicDir, 'apple-touch-icon.png');

  assert.equal(fs.existsSync(iconSvg), true, 'icon.svg must exist');
  assert.equal(fs.existsSync(iconMaskable), true, 'icon-maskable.svg must exist');
  assert.equal(fs.existsSync(pwa192), true, 'pwa-192x192.png must exist');
  assert.equal(fs.existsSync(pwa512), true, 'pwa-512x512.png must exist');
  assert.equal(fs.existsSync(pwaMaskable), true, 'pwa-maskable-512x512.png must exist');
  assert.equal(fs.existsSync(appleTouchIcon), true, 'apple-touch-icon.png must exist');

  // Verify file sizes are non-zero PNGs
  const pwa192Stat = fs.statSync(pwa192);
  const pwa512Stat = fs.statSync(pwa512);
  const appleTouchStat = fs.statSync(appleTouchIcon);

  assert.ok(pwa192Stat.size > 1000, 'pwa-192x192.png must be non-empty');
  assert.ok(pwa512Stat.size > 1000, 'pwa-512x512.png must be non-empty');
  assert.ok(appleTouchStat.size > 1000, 'apple-touch-icon.png must be non-empty');

  // Verify static manifest.json and manifest.webmanifest with description exist
  const manifestJsonPath = path.join(publicDir, 'manifest.json');
  const manifestWebmanifestPath = path.join(publicDir, 'manifest.webmanifest');
  assert.equal(fs.existsSync(manifestJsonPath), true, 'manifest.json must exist in public directory');
  assert.equal(fs.existsSync(manifestWebmanifestPath), true, 'manifest.webmanifest must exist in public directory');

  const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  assert.ok(typeof manifest.description === 'string' && manifest.description.trim().length > 15, 'Manifest description must be present and descriptive');
  assert.equal(manifest.name, 'BranchLabs - Custom Agent Chat Studio');
  assert.equal(manifest.short_name, 'BranchLabs');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#0d1117');
  assert.equal(manifest.background_color, '#0d1117');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'Manifest must declare at least 192 and 512 icons');
});

test('index.html contains all mobile app and PWA meta tags', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

  assert.ok(indexHtml.includes('viewport-fit=cover'), 'index.html must support viewport-fit=cover for notch');
  assert.ok(indexHtml.includes('apple-mobile-web-app-capable'), 'iOS web app capable tag must exist');
  assert.ok(indexHtml.includes('theme-color'), 'theme-color tag must exist');
  assert.ok(indexHtml.includes('apple-touch-icon'), 'apple-touch-icon link must exist');
  assert.ok(indexHtml.includes('rel="manifest"'), 'link rel="manifest" must exist in index.html');
});
