import {z} from 'zod'

export const createUserWithEmailAndPasswordInputModel = z.object({
    fullName: z.string().describe('name of user'),
    email: z.string().email().describe('Email of User'),
    password: z.string().describe('Password of User')
})

export const createUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe('Id of the user created'),
    needsVerification: z.boolean().optional(),
    email: z.string().optional(),
})

export const signInUserWithEmailAndPasswordInputModel = z.object({
    email: z.string().email().describe('Email of User'),
    password: z.string().describe('Password of User')
})

export const signInUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe('Id of the user created'),
    needsVerification: z.boolean().optional(),
    email: z.string().optional(),
})


export const getLoggedInUserInfoInputModel = z.undefined();
export const getLoggedInUserInfoOutputModel = z.object({
    id: z.string().describe('Id of the user created'),
    fullName: z.string().describe('name of user'),
    email: z.string().email().describe('Email of User'),
    profileImageUrl : z.string().describe('Image of the user').optional().nullable()
})

export const updateProfileInputModel = z.object({
    fullName: z.string().min(1).describe('New full name'),
})

export const updateProfileOutputModel = z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string().email(),
    profileImageUrl: z.string().nullable().optional(),
})

// OTP verification schemas
export const verifyOTPInputModel = z.object({
    email: z.string().email().describe('Email of User'),
    otp: z.string().length(6).describe('6-digit numeric OTP'),
})

export const verifyOTPOutputModel = z.object({
    id: z.string().describe('Id of verified user'),
})

export const resendOTPInputModel = z.object({
    email: z.string().email().describe('Email of User'),
})

export const resendOTPOutputModel = z.object({
    success: z.boolean(),
})

export const forgotPasswordInputModel = z.object({
    email: z.string().email().describe('Email of User'),
})

export const forgotPasswordOutputModel = z.object({
    success: z.boolean(),
    email: z.string(),
})

export const resetPasswordInputModel = z.object({
    email: z.string().email().describe('Email of User'),
    otp: z.string().length(6).describe('6-digit numeric OTP'),
    password: z.string().min(6).describe('New Password'),
})

export const resetPasswordOutputModel = z.object({
    success: z.boolean(),
})

export const signOutInputModel = z.undefined();
export const signOutOutputModel = z.object({
    success: z.boolean(),
});