import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Raiz do pacote Mira (onde estão agents/ e templates/). */
export const MIRA_ROOT = resolve(__dirname, '..', '..');

/** Pasta do projeto onde o usuário executou o comando. */
export const PROJECT_ROOT = resolve(process.cwd());

/** Caminho do arquivo de configuração do projeto. */
export const CONFIG_PATH = join(PROJECT_ROOT, 'mira.config.json');

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
