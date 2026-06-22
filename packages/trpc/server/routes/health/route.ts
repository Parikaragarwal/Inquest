import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const getPath = generatePath("/health");
const TAGS = ["Health"];

export const healthRouter = router({
    checkHealth: publicProcedure
    .meta({
        openapi: {
            method: "GET",
            path: getPath('/health'),
            tags: TAGS, 
        },
    })
    .input(zodUndefinedModel)
    .output(z.object({
        status: z.string(),
        message:z.string()
    }))
    .query(()=>{
        return {
           status: "ok",
           message:"Server is up and running"
        }
    })
});
