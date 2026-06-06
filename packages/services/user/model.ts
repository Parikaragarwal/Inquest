import { z } from "zod";

export const createUserWithEmailAndPasswordInput = z.object({
  fullName:z.string().describe('Full Name of the User'),
  email:z.email().describe('Email of User'),
  password: z.string().describe('password of the User')
});

export const signInUserWithEmailAndPasswordInput = z.object({
  email:z.email().describe('Email of User'),
  password: z.string().describe('password of the User')
})

export const generateUserTokenPayload = z.object({
  id:z.string().describe('uuid of the user'),
});


export type CreateUserWithEmailAndPasswordType = z.infer<typeof createUserWithEmailAndPasswordInput>;
export type SignInUserWithEmailAndPasswordType = z.infer<typeof signInUserWithEmailAndPasswordInput>;
export type GenerateUserTokenPayloadType = z.infer<(typeof generateUserTokenPayload)>;