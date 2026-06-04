import { ref, computed, readonly } from 'vue'

export type UserRole = 'admin' | 'member'

export interface CurrentUser {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  projectIds: string[]
}

// Module-level singleton — shared across all composable calls
const _user = ref<CurrentUser | null>(null)

export function useAuth() {
  const isAdmin = computed(() => _user.value?.role === 'admin')
  const isLoggedIn = computed(() => _user.value !== null)

  const login = (user: CurrentUser) => {
    _user.value = user
  }

  const logout = () => {
    _user.value = null
  }

  return {
    currentUser: readonly(_user),
    isAdmin,
    isLoggedIn,
    login,
    logout,
  }
}
