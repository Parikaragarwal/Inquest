import { formService } from "../../services";
import { publicProcedure, authenticatedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  createFormInputModel,
  createFormOutputModel,
  updateFormInputModel,
  updateFormOutputModel,
  deleteFormInputModel,
  deleteFormOutputModel,
  getFormByIdInputModel,
  getFormByIdOutputModel,
  getMyFormsInputModel,
  getMyFormsOutputModel,
  getFormForSubmissionInputModel,
  getFormForSubmissionOutputModel,
  setFormSubmissionStatusInputModel,
  setFormSubmissionStatusOutputModel,
  updateFormSecureCodeInputModel,
  updateFormSecureCodeOutputModel,
} from "./model";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");

export const formRouter = router({
  createForm: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/createForm"),
        tags: TAGS,
      },
    })
    .input(createFormInputModel)
    .output(createFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      const result = await formService.createForm({
        userId: ctx.user!.id,
        ...input,
      });
      return result!;
    }),

  updateForm: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/updateForm"),
        tags: TAGS,
      },
    })
    .input(updateFormInputModel)
    .output(updateFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      const result = await formService.updateForm({
        userId: ctx.user!.id,
        ...input,
      });
      return result!;
    }),

  deleteForm: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/deleteForm"),
        tags: TAGS,
      },
    })
    .input(deleteFormInputModel)
    .output(deleteFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      return formService.deleteForm({
        userId: ctx.user!.id,
        id: input.id,
      });
    }),

  getFormById: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getFormById"),
        tags: TAGS,
      },
    })
    .input(getFormByIdInputModel)
    .output(getFormByIdOutputModel)
    .query(async ({ input, ctx }) => {
      return formService.getFormById({
        userId: ctx.user!.id,
        id: input.id,
      });
    }),

  getMyForms: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getMyForms"),
        tags: TAGS,
      },
    })
    .input(getMyFormsInputModel)
    .output(getMyFormsOutputModel)
    .query(async ({ ctx }) => {
      return formService.getMyForms({
        userId: ctx.user!.id,
      });
    }),

  getFormForSubmission: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getFormForSubmission"),
        tags: TAGS,
      },
    })
    .input(getFormForSubmissionInputModel)
    .output(getFormForSubmissionOutputModel)
    .query(async ({ input }) => {
      return formService.getFormForSubmission({
        formId: input.formId,
        secureCode: input.secureCode,
      });
    }),

  setFormSubmissionStatus: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/setFormSubmissionStatus"),
        tags: TAGS,
      },
    })
    .input(setFormSubmissionStatusInputModel)
    .output(setFormSubmissionStatusOutputModel)
    .mutation(async ({ input, ctx }) => {
      return formService.setFormSubmissionStatus({
        userId: ctx.user!.id,
        id: input.id,
        isOpenForSubmission: input.isOpenForSubmission,
      });
    }),

  updateFormSecureCode: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/updateFormSecureCode"),
        tags: TAGS,
      },
    })
    .input(updateFormSecureCodeInputModel)
    .output(updateFormSecureCodeOutputModel)
    .mutation(async ({ input, ctx }) => {
      return formService.updateFormSecureCode({
        userId: ctx.user!.id,
        id: input.id,
        secureCode: input.secureCode,
      });
    }),
});
