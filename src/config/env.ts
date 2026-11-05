/**
 * Test configuration. Values come from real environment variables (CI) or from a local
 * `.env` file (git-ignored). Real environment variables win.
 */
try {
  // Node >= 20.12: loads .env without extra dependencies; does not override existing vars.
  (process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.('.env');
} catch {
  // no .env file — fine, rely on real environment variables
}

const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const env = {
  uiUrl: trimSlash(process.env.UI_URL || 'https://automationintesting.online'),
  adminUsername: process.env.ADMIN_USERNAME || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};

export const hasAdminCredentials = () => env.adminUsername !== '' && env.adminPassword !== '';
