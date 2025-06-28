import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user = session?.user || null
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  const login = useCallback(async () => {
    await signIn("google", {
      callbackUrl: "/builder",
    })
  }, [])

  const logout = useCallback(async () => {
    await signOut({
      callbackUrl: "/",
    })
  }, [])

  const requireAuth = useCallback(
    (redirectTo = "/auth/signin") => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo)
      }
    },
    [isLoading, isAuthenticated, router]
  )

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    requireAuth,
  }
}