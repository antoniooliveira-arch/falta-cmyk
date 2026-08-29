import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      // Create a mock request/response for createContext
      const headers = new Headers(req.headers);
      const cookieHeader = headers.get("cookie") || "";
      
      return createContext({
        req: {
          headers: {
            cookie: cookieHeader,
            authorization: headers.get("authorization") || undefined,
          },
        } as any,
        res: {} as any,
      });
    },
  });

export default handler;