import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";
import { getAuthenticationCookie } from "./utils/cookie";
import { userService } from "./services";

import { logger } from "@repo/logger";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({
    errorFormatter({ shape, error }) {
      logger.error(
        `[tRPC Error] Code: ${error.code} | Message: ${error.message} | Cause: ${
          error.cause instanceof Error ? error.cause.stack : JSON.stringify(error.cause || error)
        }`
      );

      let message = error.message;

      if (error.code === "INTERNAL_SERVER_ERROR") {
        message = "An unexpected error occurred. Please try again later.";
      }

      return {
        ...shape,
        message,
      };
    },
  });

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const optionalAuthenticatedProcedure = tRPCContext.procedure.use(
  async ({ ctx, next }) => {
    const token = getAuthenticationCookie(ctx);
    if (!token) return next({ ctx });
    try {
      const { id } = await userService.verifyAndDecodeUserToken(token);
      if (!id) return next({ ctx });
      return next({
        ctx: {
          ...ctx,
          user: { id },
        },
      });
    } catch {
      return next({ ctx });
    }
  }
);

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
