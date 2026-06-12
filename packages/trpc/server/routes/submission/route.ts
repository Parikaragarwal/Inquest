import { submissionService } from "../../services";
import { TRPCError } from "@trpc/server";
import { authenticatedProcedure, optionalAuthenticatedProcedure, router } from "../../trpc";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { generatePath } from "../../utils/path-generator";
import {
  submitFormInputModel,
  submitFormOutputModel,
  checkUserSubmissionInputModel,
  checkUserSubmissionOutputModel,
  getMyFormResponseInputModel,
  getMyFormResponseOutputModel,
  getFormResponsesInputModel,
  getFormResponsesOutputModel,
  getSubmissionCountInputModel,
  getSubmissionCountOutputModel,
  getBasicSubmissionAnalyticsInputModel,
  getBasicSubmissionAnalyticsOutputModel,
} from "./model";

const TAGS = ["Submissions"];
const getPath = generatePath("/submissions");

const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  enableOfflineQueue: false,
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit_submissions',
  points: 5, // 5 submissions
  duration: 60 * 60, // per 1 hour per IP
});

export const submissionRouter = router({
  submitForm: optionalAuthenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/submitForm"),
        tags: TAGS,
      },
    })
    .input(submitFormInputModel)
    .output(submitFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      // Apply Rate Limiting based on IP
      try {
        await rateLimiter.consume(ctx.ip, 1);
      } catch (rejRes) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You have submitted too many forms. Please try again later.",
        });
      }

      const result = await submissionService.submitForm({
        userId: ctx.user?.id,
        ...input,
      });
      return result;
    }),

  checkUserSubmission: optionalAuthenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/checkUserSubmission"),
        tags: TAGS,
      },
    })
    .input(checkUserSubmissionInputModel)
    .output(checkUserSubmissionOutputModel)
    .query(async ({ input, ctx }) => {
      return submissionService.checkUserSubmission({
        userId: ctx.user?.id,
        formId: input.formId,
      });
    }),

  getMyFormResponse: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getMyFormResponse"),
        tags: TAGS,
      },
    })
    .input(getMyFormResponseInputModel)
    .output(getMyFormResponseOutputModel)
    .query(async ({ input, ctx }) => {
      return submissionService.getMyFormResponse({
        userId: ctx.user!.id,
        formId: input.formId,
      });
    }),

  getFormResponses: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getFormResponses"),
        tags: TAGS,
      },
    })
    .input(getFormResponsesInputModel)
    .output(getFormResponsesOutputModel)
    .query(async ({ input, ctx }) => {
      return submissionService.getFormResponses({
        userId: ctx.user!.id,
        formId: input.formId,
      });
    }),

  getSubmissionCount: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getSubmissionCount"),
        tags: TAGS,
      },
    })
    .input(getSubmissionCountInputModel)
    .output(getSubmissionCountOutputModel)
    .query(async ({ input, ctx }) => {
      return submissionService.getSubmissionCount({
        userId: ctx.user!.id,
        formId: input.formId,
      });
    }),

  getBasicSubmissionAnalytics: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getBasicSubmissionAnalytics"),
        tags: TAGS,
      },
    })
    .input(getBasicSubmissionAnalyticsInputModel)
    .output(getBasicSubmissionAnalyticsOutputModel)
    .query(async ({ input, ctx }) => {
      return submissionService.getBasicSubmissionAnalytics({
        userId: ctx.user!.id,
        formId: input.formId,
      });
    }),
});
