import { createRequire } from 'module';
import chalk from 'chalk';

const require = createRequire(import.meta.url);
const ORANGE = chalk.hex('#FF904D');

export function applyOrangeTheme() {
  try {
    const colors = require('yoctocolors-cjs');
    colors.green = (t) => ORANGE(t);
    colors.cyan = (t) => ORANGE(t);
  } catch { /* tema é cosmético; segue sem ele */ }
}

export const ORANGE_PREFIX = '';
