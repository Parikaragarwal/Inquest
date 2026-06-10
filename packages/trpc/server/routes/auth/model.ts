import {z} from 'zod'

export const createUserWithEmailAndPasswordInputModel = z.object({
    fullName: z.string().describe('name of user'),
    email: z.email().describe('Email of User'),
    password: z.string().describe('Password of User')
})

export const createUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe('Id of the user created'),
})

export const signInUserWithEmailAndPasswordInputModel = z.object({
    email: z.email().describe('Email of User'),
    password: z.string().describe('Password of User')
})

export const signInUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe('Id of the user created'),
})


export const getLoggedInUserInfoInputModel = z.undefined();
export const getLoggedInUserInfoOutputModel = z.object({
    id: z.string().describe('Id of the user created'),
    fullName: z.string().describe('name of user'),
    email: z.email().describe('Email of User'),
    profileImageUrl : z.string().describe('Image of the user').optional().nullable()
})

export const updateProfileInputModel = z.object({
    fullName: z.string().min(1).describe('New full name'),
})

export const updateProfileOutputModel = z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.email(),
    profileImageUrl: z.string().nullable().optional(),
})