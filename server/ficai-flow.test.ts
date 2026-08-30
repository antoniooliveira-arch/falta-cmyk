import { describe, expect, it } from "vitest";
import { createSubmission } from "./db";

describe("FICAI submission flow", () => {
  it("links draft absences to the school submission and marks them as sent", async () => {
    let updated: Record<string, unknown> | undefined;
    const fakeDb = {
      insert: () => ({ values: async () => [{ insertId: 77 }] }),
      update: () => ({ set: (payload: Record<string, unknown>) => ({ where: async () => { updated = payload; } }) }),
    };

    const result = await createSubmission({ escolaId: 2, usuarioId: 8, periodo: "Agosto de 2026" }, fakeDb);
    expect(result).toBe(77);
    expect(updated).toEqual({ envioId: 77, status: "ENVIADO" });
  });
});
