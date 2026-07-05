import { trpc } from '~/trpc/client'

export const useSignUp = ()=>{
const utils = trpc.useUtils();
const {
     mutateAsync: createUserWithEmailAndPasswordAsync,
     mutate: createUserWithEmailAndPassword,
     error,
     failureCount,
     isError,
     isIdle,
     isSuccess,
     status
    } = trpc.auth.createUserWithEmailAndPassword.useMutation({
        onSuccess: async ()=>{
            await utils.auth.getLoggedInUserInfo.invalidate()
        }
    });
return {
    createUserWithEmailAndPassword,
    createUserWithEmailAndPasswordAsync,
     error,
     failureCount,
     isError,
     isIdle,
     isSuccess,
     status
}
}

export const useLogin = ()=>{
    const utils = trpc.useUtils();
const {
     mutateAsync: signInUserWithEmailAndPasswordAsync,
     mutate: signInUserWithEmailAndPassword,
     error,
     failureCount,
     isError,
     isIdle,
     isSuccess,
     status
    } = trpc.auth.signInUserWithEmailAndPassword.useMutation({
          onSuccess: async ()=>{
            await utils.auth.getLoggedInUserInfo.invalidate()
        }
    });
return {
     signInUserWithEmailAndPassword,
     signInUserWithEmailAndPasswordAsync,
     error,
     failureCount,
     isError,
     isIdle,
     isSuccess,
     status
}
}

export const useGetuser = ()=>{
    const {
        data:user,
        error,
        isFetched,
        isFetching,
        isLoading,
        status
    } = trpc.auth.getLoggedInUserInfo.useQuery();

    return {
        user,
        error,
        isFetched,
        isFetching,
        isLoading,
        status
    }
}

export const useLogout = () => {
    const utils = trpc.useUtils();
    const { mutateAsync: signOutAsync, mutate: signOut } = trpc.auth.signOut.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        }
    });

    return {
        signOut,
        signOutAsync
    }
}