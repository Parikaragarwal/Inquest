import { z } from "zod";

export const createUserWithEmailAndPasswordInput = z.object({
  fullName:z.string().describe('Full Name of the User'),
  email:z.string().email().describe('Email of User'),
  password: z.string().describe('password of the User')
});

export const signInUserWithEmailAndPasswordInput = z.object({
  email:z.string().email().describe('Email of User'),
  password: z.string().describe('password of the User')
});

export const generateUserTokenPayload = z.object({
  id:z.string().describe('uuid of the user'),
});

export const verifyOTPInput = z.object({
  email: z.string().email().describe('Email of User'),
  otp: z.string().length(6).describe('6-digit numeric OTP'),
});

export const resendOTPInput = z.object({
  email: z.string().email().describe('Email of User'),
});

export const forgotPasswordInput = z.object({
  email: z.string().email().describe('Email of User'),
});

export const resetPasswordInput = z.object({
  email: z.string().email().describe('Email of User'),
  otp: z.string().length(6).describe('6-digit numeric OTP'),
  password: z.string().min(6).describe('New Password of the User'),
});

export type CreateUserWithEmailAndPasswordType = z.infer<typeof createUserWithEmailAndPasswordInput>;
export type SignInUserWithEmailAndPasswordType = z.infer<typeof signInUserWithEmailAndPasswordInput>;
export type GenerateUserTokenPayloadType = z.infer<(typeof generateUserTokenPayload)>;
export type VerifyOTPInputType = z.infer<typeof verifyOTPInput>;
export type ResendOTPInputType = z.infer<typeof resendOTPInput>;
export type ForgotPasswordInputType = z.infer<typeof forgotPasswordInput>;
export type ResetPasswordInputType = z.infer<typeof resetPasswordInput>;