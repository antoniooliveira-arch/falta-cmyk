import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("business access rules", () => {
  it("rejects a school account without an active linked unit", async () => {
    const caller = appRouter.createCaller({ user: { id: 987654, openId: "school-test", name: "Escola", email: "escola@test", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as any, res: {} as any });
    await expect(caller.dashboard.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("exposes the exact five workflow states", async () => {
    const caller = appRouter.createCaller({ user: { id: 1, openId: "admin-test", name: "Admin", email: "admin@test", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as any, res: {} as any });
    await expect(caller.submissions.statuses()).resolves.toEqual(["RASCUNHO", "ENVIADO", "EM_ANALISE", "APROVADO", "REJEITADO"]);
  });
});
