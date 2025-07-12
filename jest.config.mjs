import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  modulePathIgnorePatterns: ['dist','build']
};
