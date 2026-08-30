import { describe, expect, it, vi } from "vitest";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getBusinessUser: vi.fn(), normalizePeriod: actual.normalizePeriod };
});

import { appRouter } from "./routers";
import { getBusinessUser } from "./db";

const schoolUser = { id: 44, openId: "school", name: "Escola", email: "school@test", loginMethod: "oauth", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function fakeDatabase() {
  let updated: Record<string, unknown> | undefined;
  const database = {
    insert: () => ({ values: async () => [{ insertId: 91 }] }),
    update: () => ({ set: (payload: Record<string, unknown>) => ({ where: async () => { updated = payload; } }) }),
  };
  return { database, getUpdated: () => updated };
}

describe("submissions.create school scope", () => {
  it("uses the linked school, normalizes period and sends FICAI drafts", async () => {
    vi.mocked(getBusinessUser).mockResolvedValue({ id: 9, authUserId: 44, nome: "CEI ARCO IRIS", email: "school@test", perfil: "ESCOLA", escolaId: 3, ativo: 1, createdAt: new Date(), updatedAt: new Date() });
    const fake = fakeDatabase();
    const caller = appRouter.createCaller({ user: schoolUser, req: {} as any, res: {} as any, database: fake.database } as any);
    await expect(caller.submissions.create({ periodo: "Agosto de 2026" })).resolves.toBe(91);
    expect(fake.getUpdated()).toEqual({ envioId: 91, status: "ENVIADO" });
  });

  it("blocks a school from sending for another unit", async () => {
    vi.mocked(getBusinessUser).mockResolvedValue({ id: 9, authUserId: 44, nome: "CEI ARCO IRIS", email: "school@test", perfil: "ESCOLA", escolaId: 3, ativo: 1, createdAt: new Date(), updatedAt: new Date() });
    const caller = appRouter.createCaller({ user: schoolUser, req: {} as any, res: {} as any, database: fakeDatabase().database } as any);
    await expect(caller.submissions.create({ escolaId: 4, periodo: "2026-08" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects unsupported free-form periods", async () => {
    const caller = appRouter.createCaller({ user: schoolUser, req: {} as any, res: {} as any, database: fakeDatabase().database } as any);
    await expect(caller.submissions.create({ periodo: "qualquer período" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
