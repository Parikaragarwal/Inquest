import { signInUserWithEmailAndPasswordInput } from "@repo/services/user/model";
import { userService } from "../../services";
import { publicProcedure, authenticatedProcedure, router } from "../../trpc";
import { getAuthenticationCookie, setAuthenticatonCookie } from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";
import { createUserWithEmailAndPasswordInputModel
  ,createUserWithEmailAndPasswordOutputModel,
   getLoggedInUserInfoInputModel,
   getLoggedInUserInfoOutputModel,
   signInUserWithEmailAndPasswordInputModel, 
   signInUserWithEmailAndPasswordOutputModel,
   updateProfileInputModel,
   updateProfileOutputModel} from "./model";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure.meta({
    openapi:{
      method:'POST',
      path: getPath('/createUserWithEmailAndPassword'),
      tags: TAGS
    }
  }).input(createUserWithEmailAndPasswordInputModel).output(createUserWithEmailAndPasswordOutputModel)
  .mutation(async ({input,ctx})=>{
    const {fullName,email,password} = input;
    const {id,token} = await userService.createUserWithEmailAndPassword({
      fullName,email,password
    });
    setAuthenticatonCookie(ctx,token);
    return {
      id
    };
  }),

  signInUserWithEmailAndPassword: publicProcedure.meta({
    openapi:{
      method:'POST',
      path: getPath('/signInUserWithEmailAndPassword'),
      tags: TAGS
    }
  }).input(signInUserWithEmailAndPasswordInputModel)
  .output(signInUserWithEmailAndPasswordOutputModel)
  .mutation(async ({input,ctx})=>{
    const {email,password} = input;
    const {id,token} = await userService.signinUserWithEmailAndPassword({
      email,
      password
    });

    setAuthenticatonCookie(ctx,token);
    return {
      id,
    }
  }),

  getLoggedInUserInfo: publicProcedure.meta({
    openapi:{
      method:'GET',
      path: getPath('/getLoggedInUserInfo'),
      tags: TAGS
    }
  })
  .input(getLoggedInUserInfoInputModel)
  .output(getLoggedInUserInfoOutputModel)
  .query(async ({ctx})=>{
    const userToken = getAuthenticationCookie(ctx);
    if(!userToken) throw new Error('User is not Logged In');
    const {id,email,fullName,profileImageUrl} = await userService.verifyAndDecodeUserToken(userToken);

    if(!id || !email || !fullName) throw new Error('User data not found');

    return {
      id,
      email,fullName,profileImageUrl
    }
  }),

  updateProfile: authenticatedProcedure.meta({
    openapi:{
      method:'PATCH',
      path: getPath('/updateProfile'),
      tags: TAGS
    }
  })
  .input(updateProfileInputModel)
  .output(updateProfileOutputModel)
  .mutation(async ({input, ctx})=>{
    const result = await userService.updateProfile({
      userId: ctx.user!.id,
      fullName: input.fullName,
    });
    if (!result) throw new Error('Profile update failed');
    return result;
  }),

});
