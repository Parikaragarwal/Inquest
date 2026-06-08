import type {CreateExpressContextOptions} from '@trpc/server/adapters/express'
import {clearCookieFactory, createCookieFactory, getCookieFactory} from './utils/cookie'
export interface TRPCContext {
    createCookie: ReturnType<typeof createCookieFactory>
    getCookie: ReturnType<typeof getCookieFactory>
    clearCookie: ReturnType<typeof clearCookieFactory>
    user?: { id: string }
}

export async function createContext({
    req,res
}:CreateExpressContextOptions):Promise<TRPCContext> {

    const ctx: TRPCContext = {
        createCookie: createCookieFactory(res),
        getCookie: getCookieFactory(req),
        clearCookie: clearCookieFactory(res),
    }
    return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;
