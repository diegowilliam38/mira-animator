import { createHash } from 'crypto';
import { readFileSync, existsSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

export function hashFile(filePath) {
  if (!existsSync(filePath)) return null;
  if (statSync(filePath).isDirectory()) return null;
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

export function buildManifest(projectRoot, relPaths) {
  const manifest = {};
  for (const relPath of relPaths) {
    const hash = hashFile(join(projectRoot, relPath));
    if (hash) manifest[relPath] = hash;
  }
  return manifest;
}

export function saveManifest(projectRoot, manifest) {
  const manifestPath = join(projectRoot, '.mira', '_config', 'files-manifest.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

export function loadManifest(projectRoot) {
  const manifestPath = join(projectRoot, '.mira', '_config', 'files-manifest.json');
  if (!existsSync(manifestPath)) return {};
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

// 'intact' | 'modified' | 'missing'
export function fileStatus(projectRoot, relPath, originalHash) {
  const current = hashFile(join(projectRoot, relPath));
  if (!current) return 'missing';
  return current === originalHash ? 'intact' : 'modified';
}
