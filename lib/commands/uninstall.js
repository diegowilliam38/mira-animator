import { join, resolve } from 'path';
import { existsSync, rmSync, statSync } from 'fs';
import { checkExistingInstallation } from '../installer/validator.js';
import { CONFIG_PATH } from '../utils/paths.js';

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

  rmSync(join(projectRoot, '.mira'), { recursive: true, force: true });
  rmSync(CONFIG_PATH, { force: true });

  console.log(`\n  Mira removido (${removed} itens).`);
  console.log('  A pasta decks/ com suas apresentações foi preservada.\n');
}
