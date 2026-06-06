import type {CookieOptions, Response, Request} from 'express'
import { TRPCContext } from '../context';

const MINUTE = 60*1000;
const HOUR = 60 * MINUTE;
const DAY = 24* HOUR;
const MONTH = 20* DAY;
const YEAR = 12* MONTH;

const defaultCookieOption: CookieOptions = {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite:'strict',
    maxAge: YEAR
};

export function createCookieFactory(res:Response){
    return function createCookie(name:string,value:string,opts: CookieOptions = defaultCookieOption){
        res.cookie(name,value,opts);
    }
}

export function getCookieFactory(req:Request) {
    return function getCookie(name:string){
        return req.cookies?.[name];
    }
}

export function clearCookieFactory(res:Response){
    return function clearCookie(name: string){
        res.clearCookie(name);
    }
}

const AUTH_COOKIE_NAME = 'authentication-token';

export function setAuthenticatonCookie(ctx:TRPCContext,accessToken:string){
    ctx.createCookie(AUTH_COOKIE_NAME,accessToken);
}

export function getAuthenticationCookie(ctx: TRPCContext){
    return ctx.getCookie(AUTH_COOKIE_NAME);
}

export function clearAuthenticationCookie(ctx: TRPCContext){
    ctx.clearCookie(AUTH_COOKIE_NAME);
}