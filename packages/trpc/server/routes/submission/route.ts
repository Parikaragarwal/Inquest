import { submissionService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
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

export const submissionRouter = router({
  submitForm: authenticatedProcedure
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
      const result = await submissionService.submitForm({
        userId: ctx.user!.id,
        ...input,
      });
      return result;
    }),

  checkUserSubmission: authenticatedProcedure
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
        userId: ctx.user!.id,
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
