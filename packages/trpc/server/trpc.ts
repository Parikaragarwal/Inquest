import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";
import { getAuthenticationCookie } from "./utils/cookie";
import { userService } from "./services";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authenticatedProcedure = tRPCContext.procedure.use(
  async ({ ctx, next }) => {
    const token = getAuthenticationCookie(ctx);
    if (!token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    try {
      const { id } = await userService.verifyAndDecodeUserToken(token);
      if (!id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid authentication token",
        });
      }

      return next({
        ctx: {
          ...ctx,
          user: { id },
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired authentication token",
      });
    }
  }
);
