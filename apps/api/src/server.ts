import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from 'cookie-parser'

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext, userService, createCookieFactory } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Inquest OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});


  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials:true
    }),
  );

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "Streamyst is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "Streamyst server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.get("/auth/google", (req, res) => {
  try {
    const url = userService.generateGoogleOAuthUrl();
    res.redirect(url);
  } catch (error: any) {
    logger.error("Google Auth Error: " + error.message);
    res.redirect("/login?error=google_auth_failed");
  }
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.redirect("/login?error=invalid_code");
  }

  try {
    const { token } = await userService.signInWithGoogleAuthorizationCode({ code });
    
    const createCookie = createCookieFactory(res);
    // Mimic the same options as defaultCookieOption in utils/cookie.ts
    const YEAR = 12 * 20 * 24 * 60 * 60 * 1000;
    createCookie('authentication-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: YEAR
    });

    res.redirect(`${env.CLIENT_URL}/dashboard`);
  } catch (error: any) {
    logger.error("Google Callback Error: " + error.message);
    res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
  }
});

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
