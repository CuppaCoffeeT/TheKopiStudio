import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillCredentials(email: string, password: string) {
    await this.page.getByTestId('login-email-input').fill(email);
    await this.page.getByTestId('login-password-input').fill(password);
  }

  async submit() {
    const btn = this.page.getByTestId('login-submit-btn');
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    // Poll until button is enabled (not disabled by loading={submitting})
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        return el && !el.disabled;
      },
      '[data-testid="login-submit-btn"]',
      { timeout: 10_000 },
    );
    await btn.click({ timeout: 30_000 });
  }

  private onLoginPath() {
    try {
      return new URL(this.page.url()).pathname.startsWith('/login');
    } catch {
      return true;
    }
  }

  async signIn(email: string, password: string) {
    await this.goto();
    // Idempotent + race-hardened. When a saved session is reused (parallel-run
    // storageState), /login auto-redirects authed users to /dashboard
    // (useLoginRedirect). But session hydration is async: the login FORM can
    // flash visible for a beat BEFORE the redirect fires. The old 3s probe
    // committed to the UI-login path on that flash, then the form unmounted
    // mid-fill → "waiting for login-email-input / login-submit-btn" timeouts
    // (the empty-login failures seen under 6-worker load). So we never trust a
    // momentary form sighting: we attempt login but treat "bounced off /login"
    // at ANY step as proof of an authed session and return cleanly.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!this.onLoginPath()) return; // already redirected → authed

      const hasForm = await this.page
        .getByTestId('login-email-input')
        .waitFor({ state: 'visible', timeout: 4_000 })
        .then(() => true)
        .catch(() => false);

      if (!hasForm) {
        // No form yet & still on /login → mid-hydration redirect. Wait it out.
        await this.page
          .waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 12_000 })
          .catch(() => {});
        if (!this.onLoginPath()) return;
        continue; // retry the probe; serial gate (no storageState) keeps the form
      }

      try {
        await this.fillCredentials(email, password);
        await this.submit();
        await this.page.waitForURL((u) => !u.pathname.startsWith('/login'), {
          timeout: 45_000,
        });
        return;
      } catch (err) {
        // A late authed-redirect can detach the form during fill/submit. If we
        // ended up off /login, that's success (authed), not a failure.
        if (!this.onLoginPath()) return;
        throw err;
      }
    }
    // Exhausted retries still on /login with no stable form — surface clearly.
    if (this.onLoginPath()) {
      throw new Error(
        '[LoginPage.signIn] stuck on /login after 3 settle attempts — ' +
          'form never stabilised and no authed redirect fired.',
      );
    }
  }
}
