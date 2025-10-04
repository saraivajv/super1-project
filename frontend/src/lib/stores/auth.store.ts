import { derived, get, writable } from "svelte/store"

interface User {
  id: string
  name: string
  email: string
  role: "client" | "provider"
}

const userStore = writable<User | null>(null)
const tokenStore = writable<string | null>(null)

if (typeof window !== "undefined") {
  const storedUser = localStorage.getItem("user")
  const storedToken = localStorage.getItem("token")

  if (storedUser && storedToken) {
    userStore.set(JSON.parse(storedUser))
    tokenStore.set(storedToken)
  }
}

const isAuthenticated = derived([userStore, tokenStore], ([$user, $token]) => $user !== null && $token !== null)

export const authStore = {
  user: userStore,
  token: tokenStore,
  isAuthenticated,

  login(user: User, token: string) {
    userStore.set(user)

    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    tokenStore.set(tokenValue);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", tokenValue)
    }
  },

  logout() {
    userStore.set(null)
    tokenStore.set(null)

    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
    }
  },

  getToken() {
    return get(tokenStore)
  },

  isProvider() {
    const user = get(userStore)
    return user?.role === "provider"
  },

  isClient() {
    const user = get(userStore)
    return user?.role === "client"
  },
}
    

