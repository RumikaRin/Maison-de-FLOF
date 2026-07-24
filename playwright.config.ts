import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "cross-env PORT=3100 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/flof_test AUTH_SECRET=flof-e2e-secret AUTH_URL=http://127.0.0.1:3100 AUTH_TRUST_HOST=true E2E_TEST_MODE=1 npm run start",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
