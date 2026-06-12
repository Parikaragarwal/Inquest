import type {CreateExpressContextOptions} from '@trpc/server/adapters/express'
import {clearCookieFactory, createCookieFactory, getCookieFactory} from './utils/cookie'
export interface TRPCContext {
    createCookie: ReturnType<typeof createCookieFactory>
    getCookie: ReturnType<typeof getCookieFactory>
    clearCookie: ReturnType<typeof clearCookieFactory>
    user?: { id: string }
    ip: string
}

export async function createContext({
    req,res
}:CreateExpressContextOptions):Promise<TRPCContext> {

    const ctx: TRPCContext = {
        createCookie: createCookieFactory(res),
        getCookie: getCookieFactory(req),
        clearCookie: clearCookieFactory(res),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1',
    }
    return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;
