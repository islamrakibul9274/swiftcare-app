import { test as base, expect, type APIRequestContext } from "@playwright/test";
export { expect };
export const origin = "http://localhost:3000";
export type Account = "admin" | "bcba" | "rbt" | "outsider";
export const password = "SwiftCareDemo2026!";
export async function login(
  context: APIRequestContext,
  email: string,
  secret = password,
) {
  const csrf = await (await context.get("/api/auth/csrf")).json();
  await context.post("/api/auth/callback/credentials", {
    form: {
      email,
      password: secret,
      csrfToken: csrf.csrfToken,
      callbackUrl: origin,
    },
    headers: { Origin: origin, "X-Auth-Return-Redirect": "1" },
  });
}
export const test = base.extend<
  object,
  { accounts: Record<Account, APIRequestContext> }
>({
  accounts: [
    async ({ playwright }, use) => {
      const guard = await playwright.request.newContext({ baseURL: origin });
      const html = await (await guard.get("/login")).text();
      expect(html).toContain("Synthetic demo clinic");
      await guard.dispose();
      const accounts = {} as Record<Account, APIRequestContext>;
      for (const role of ["admin", "bcba", "rbt", "outsider"] as Account[]) {
        const context = await playwright.request.newContext({
          baseURL: origin,
          extraHTTPHeaders: { Origin: origin },
        });
        await login(context, `${role}@demo.swiftcare.example`);
        expect((await context.get("/api/workspace/profile")).status()).toBe(
          200,
        );
        accounts[role] = context;
      }
      await use(accounts);
      for (const context of Object.values(accounts)) await context.dispose();
    },
    { scope: "worker" },
  ],
});
