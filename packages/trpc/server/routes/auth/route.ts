import { userService } from "../../services";
import { publicProcedure, authenticatedProcedure, router } from "../../trpc";
import { getAuthenticationCookie, setAuthenticatonCookie } from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";
import {
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel,
  getLoggedInUserInfoInputModel,
  getLoggedInUserInfoOutputModel,
  signInUserWithEmailAndPasswordInputModel,
  signInUserWithEmailAndPasswordOutputModel,
  updateProfileInputModel,
  updateProfileOutputModel,
  verifyOTPInputModel,
  verifyOTPOutputModel,
  resendOTPInputModel,
  resendOTPOutputModel,
  forgotPasswordInputModel,
  forgotPasswordOutputModel,
  resetPasswordInputModel,
  resetPasswordOutputModel,
} from "./model";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/createUserWithEmailAndPassword"),
        tags: TAGS,
      },
    })
    .input(createUserWithEmailAndPasswordInputModel)
    .output(createUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input }) => {
      const { fullName, email, password } = input;
      const result = await userService.createUserWithEmailAndPassword({
        fullName,
        email,
        password,
      });
      return result;
    }),

  signInUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/signInUserWithEmailAndPassword"),
        tags: TAGS,
      },
    })
    .input(signInUserWithEmailAndPasswordInputModel)
    .output(signInUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      const result = await userService.signinUserWithEmailAndPassword({
        email,
        password,
      });

      if (result.token) {
        setAuthenticatonCookie(ctx, result.token);
      }
      
      return {
        id: result.id,
        needsVerification: result.needsVerification,
        email: result.email,
      };
    }),

  getLoggedInUserInfo: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getLoggedInUserInfo"),
        tags: TAGS,
      },
    })
    .input(getLoggedInUserInfoInputModel)
    .output(getLoggedInUserInfoOutputModel)
    .query(async ({ ctx }) => {
      const userToken = getAuthenticationCookie(ctx);
      if (!userToken) throw new Error("User is not Logged In");
      const { id, email, fullName, profileImageUrl } =
        await userService.verifyAndDecodeUserToken(userToken);

      if (!id || !email || !fullName) throw new Error("User data not found");

      return {
        id,
        email,
        fullName,
        profileImageUrl,
      };
    }),

  updateProfile: authenticatedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/updateProfile"),
        tags: TAGS,
      },
    })
    .input(updateProfileInputModel)
    .output(updateProfileOutputModel)
    .mutation(async ({ input, ctx }) => {
      const result = await userService.updateProfile({
        userId: ctx.user!.id,
        fullName: input.fullName,
      });
      if (!result) throw new Error("Profile update failed");
      return result;
    }),

  verifyOTP: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/verifyOTP"),
        tags: TAGS,
      },
    })
    .input(verifyOTPInputModel)
    .output(verifyOTPOutputModel)
    .mutation(async ({ input, ctx }) => {
      const result = await userService.verifyOTP(input);
      setAuthenticatonCookie(ctx, result.token);
      return { id: result.id };
    }),

  resendOTP: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/resendOTP"),
        tags: TAGS,
      },
    })
    .input(resendOTPInputModel)
    .output(resendOTPOutputModel)
    .mutation(async ({ input }) => {
      return userService.resendOTP(input);
    }),

  forgotPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/forgotPassword"),
        tags: TAGS,
      },
    })
    .input(forgotPasswordInputModel)
    .output(forgotPasswordOutputModel)
    .mutation(async ({ input }) => {
      return userService.forgotPassword(input);
    }),

  resetPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/resetPassword"),
        tags: TAGS,
      },
    })
    .input(resetPasswordInputModel)
    .output(resetPasswordOutputModel)
    .mutation(async ({ input }) => {
      return userService.resetPassword(input);
    }),
});
