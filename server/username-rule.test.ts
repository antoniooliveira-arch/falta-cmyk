import { describe, expect, it } from "vitest";
import { createBusinessUser, resolveBusinessUsername } from "./db";

describe("school username rule", () => {
  it("derives the ESCOLA username from the linked school name", () => {
    expect(resolveBusinessUsername({ perfil: "ESCOLA", schoolName: "CEI LUIZ FELIPE", fallback: "nome manual" })).toBe("CEI LUIZ FELIPE");
  });

  it("keeps the provided name for ADMIN", () => {
    expect(resolveBusinessUsername({ perfil: "ADMIN", schoolName: "CEI LUIZ FELIPE", fallback: "Secretaria" })).toBe("Secretaria");
  });

  it("persists the linked school name in the real createBusinessUser flow", async () => {
    let saved: Record<string, unknown> | undefined;
    const fakeDb = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ nome: "CEI LUIZ FELIPE" }] }) }) }),
      insert: () => ({ values: (payload: Record<string, unknown>) => { saved = payload; return Promise.resolve(); } }),
    };

    await createBusinessUser({ authUserId: 10, nome: "nome manual", email: "escola@example.com", perfil: "ESCOLA", escolaId: 1 }, fakeDb);
    expect(saved?.nome).toBe("CEI LUIZ FELIPE");
  });
});
