import { publicProcedure, router } from "./trpc";
import {z} from 'zod'
import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { formRouter } from "./routes/form/route";
import { submissionRouter } from "./routes/submission/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  form: formRouter,
  submission: submissionRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
