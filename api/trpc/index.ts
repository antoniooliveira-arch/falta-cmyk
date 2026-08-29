import { appRouter } from "../../server/routers";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      return { req: {} as any, res: {} as any, user: null };
    },
  });

export default handler;