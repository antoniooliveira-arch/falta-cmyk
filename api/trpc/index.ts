import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const handler = createExpressMiddleware({
  router: appRouter,
  createContext,
});

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}