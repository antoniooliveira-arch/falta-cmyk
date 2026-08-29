import { appRouter } from "../../server/routers";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      return { req: {}, res: {}, user: null };
    },
  });

export default handler;