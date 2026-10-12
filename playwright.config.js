import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4173/fandomwiki-generator/', browserName: 'chromium' },
  webServer: { command: 'npm run dev', env: { BASE_PATH: '/fandomwiki-generator', PORT: '4173' }, url: 'http://127.0.0.1:4173/fandomwiki-generator/', reuseExistingServer: false },
});
