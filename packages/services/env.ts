import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().describe('Secret Key for JWT Tokens'),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional().describe('Google OAuth Client ID'),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().describe('Google OAuth Client Secret'),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional().describe('Google OAuth Redirect URI'),
  RESEND_API_KEY: z.string().optional().describe('Resend API Key for sending emails'),
  RESEND_FROM_EMAIL: z.string().default('Inquest <onboarding@resend.dev>').describe('Sender email for Resend')
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
