import { join, resolve } from 'path';
import { existsSync, rmSync, statSync, readFileSync, writeFileSync } from 'fs';
import { checkExistingInstallation } from '../installer/validator.js';
import { CONFIG_PATH } from '../utils/paths.js';

// Remove nosso hook de aviso de `.claude/settings.json` se ele foi mesclado num
// arquivo pré-existente (que o uninstall não apaga). Preserva o resto.
function pruneSessionHook(projectRoot) {
  const settingsPath = join(projectRoot, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) return;
  let settings;
  try { settings = JSON.parse(readFileSync(settingsPath, 'utf8')); } catch { return; }
  const starts = settings?.hooks?.SessionStart;
  if (!Array.isArray(starts)) return;

  settings.hooks.SessionStart = starts
    .map(entry => ({
      ...entry,
      hooks: (entry?.hooks ?? []).filter(h => !String(h?.command || '').includes('version-notice.js')),
    }))
    .filter(entry => (entry.hooks ?? []).length > 0);

  if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
  if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

export default async function uninstall() {
  const projectRoot = resolve(process.cwd());
  const existing = checkExistingInstallation(projectRoot);

  if (!existing.installed) {
    console.log('\n  O Mira não está instalado nesta pasta.\n');
    return;
  }

  const created = existing.state.createdFiles ?? [];

  const paths = created
    .map(rel => join(projectRoot, rel))
    .filter(p => existsSync(p));
  const files = paths.filter(p => !statSync(p).isDirectory());
  const dirs = paths.filter(p => statSync(p).isDirectory())
    .sort((a, b) => b.length - a.length);

  let removed = 0;
  for (const f of files) { rmSync(f, { force: true }); removed++; }
  for (const d of dirs) {
    try { rmSync(d, { recursive: true, force: true }); removed++; } catch { /* ignore */ }
  }

  pruneSessionHook(projectRoot);
  rmSync(join(projectRoot, '.mira'), { recursive: true, force: true });
  rmSync(CONFIG_PATH, { force: true });

  console.log(`\n  Mira removido (${removed} itens).`);
  console.log('  A pasta decks/ com suas apresentações foi preservada.\n');
}
