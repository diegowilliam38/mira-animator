import { join, resolve } from 'path';
import { existsSync, readdirSync } from 'fs';
import { checkExistingInstallation } from '../installer/validator.js';
import { loadManifest, fileStatus } from '../installer/manifest.js';
import { loadConfig } from '../utils/paths.js';

export default async function status() {
  const projectRoot = resolve(process.cwd());
  const existing = checkExistingInstallation(projectRoot);

  if (!existing.installed) {
    console.log('\n  O Mira não está instalado nesta pasta. Execute "npx mira-animator install".\n');
    return;
  }

  const state = existing.state;
  const config = loadConfig() ?? {};

  console.log(`\n  Mira v${state.version} — ${config.projectName ?? '(sem nome)'}`);
  console.log(`  Instalado em: ${state.installedAt}`);
  console.log(`  Engines:      ${(state.engines ?? []).join(', ')}`);
  console.log(`  Agents:       ${(state.agents ?? []).filter(a => a !== '_shared').length}`);
  console.log(`  Tema padrão:  ${config.defaultTheme ?? 'mira-dark'}`);

  const sources = config.sources ?? [];
  console.log(`\n  Fontes (${sources.length}):`);
  for (const s of sources) {
    console.log(`    - ${s.name} (${s.type}) ${existsSync(s.path) ? '' : '[NÃO ENCONTRADA]'}`);
  }

  const decksDir = join(projectRoot, 'decks');
  const decks = existsSync(decksDir) ? readdirSync(decksDir) : [];
  console.log(`\n  Decks (${decks.length}):`);
  for (const d of decks) console.log(`    - ${d}`);

  const manifest = loadManifest(projectRoot);
  const entries = Object.entries(manifest);
  if (entries.length > 0) {
    let intact = 0, modified = 0, missing = 0;
    for (const [rel, hash] of entries) {
      const st = fileStatus(projectRoot, rel, hash);
      if (st === 'intact') intact++;
      else if (st === 'modified') modified++;
      else missing++;
    }
    console.log(`\n  Integridade: ${intact} intactos, ${modified} modificados, ${missing} ausentes (${entries.length} rastreados)`);
  }
  console.log('');
}
