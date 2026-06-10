import { resolve, basename, extname } from 'path';
import { existsSync, statSync } from 'fs';
import { loadConfig, saveConfig } from '../utils/paths.js';

function inferType(path) {
  if (statSync(path).isDirectory()) return 'projeto';
  const ext = extname(path).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.tex') return 'latex';
  return 'texto';
}

export default async function link(args) {
  const config = loadConfig();
  if (!config) {
    console.error('\n  Mira não está instalado nesta pasta. Execute "npx mira-animator install" primeiro.\n');
    process.exit(1);
  }

  const positional = args.filter(a => !a.startsWith('--'));
  const flags = Object.fromEntries(
    args.filter(a => a.startsWith('--')).map(a => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? true];
    })
  );

  if (positional.length === 0) {
    console.error('\n  Uso: npx mira-animator link <caminho> [--name=apelido] [--type=projeto|pdf|latex|texto]\n');
    process.exit(1);
  }

  const path = resolve(positional[0]);
  if (!existsSync(path)) {
    console.error(`\n  Caminho não encontrado: ${path}\n`);
    process.exit(1);
  }

  const name = flags.name ?? basename(path).replace(/^\./, '').replace(/\.[^.]+$/, '');
  const type = flags.type ?? inferType(path);

  config.sources = config.sources ?? [];
  const idx = config.sources.findIndex(s => s.name === name);
  const source = { name, path, type, linkedAt: new Date().toISOString() };
  if (idx >= 0) {
    config.sources[idx] = source;
    console.log(`\n  Fonte "${name}" atualizada → ${path} (${type})\n`);
  } else {
    config.sources.push(source);
    console.log(`\n  Fonte "${name}" vinculada → ${path} (${type})\n`);
  }
  saveConfig(config);
}
