import { existsSync } from 'fs';
import { loadConfig } from '../utils/paths.js';

export default async function sources() {
  const config = loadConfig();
  if (!config) {
    console.error('\n  Mira não está instalado nesta pasta. Execute "npx mira-animator install" primeiro.\n');
    process.exit(1);
  }

  const list = config.sources ?? [];
  if (list.length === 0) {
    console.log('\n  Nenhuma fonte vinculada. Use: npx mira-animator link <caminho>\n');
    return;
  }

  console.log('\n  Fontes vinculadas:\n');
  for (const s of list) {
    const ok = existsSync(s.path) ? 'ok' : 'NÃO ENCONTRADA';
    console.log(`    ${s.name.padEnd(20)} ${s.type.padEnd(8)} ${s.path}  [${ok}]`);
  }
  console.log('');
}
