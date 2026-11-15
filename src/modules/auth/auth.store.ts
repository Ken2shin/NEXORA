import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, LoginCredentials, RegisterCredentials, UserRole } from '@/shared/types/user.types'
import { repositories } from '@/shared/infrastructure/provider'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<UserProfile | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const role = computed<UserRole | null>(() => currentUser.value?.role || null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isEmployee = computed(() => currentUser.value?.role === 'employee')
  const isStaff = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'employee')
  const isClient = computed(() => currentUser.value?.role === 'client')

  async function login(credentials: LoginCredentials): Promise<UserProfile> {
    isLoading.value = true
    error.value = null
    try {
      const user = await repositories.auth.signIn(credentials)
      currentUser.value = user
      sessionStorage.setItem('nexora_active_user', JSON.stringify(user))
      return user
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      error.value = message
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function register(credentials: RegisterCredentials): Promise<UserProfile> {
    isLoading.value = true
    error.value = null
    try {
      const user = await repositories.auth.signUp(credentials)
      currentUser.value = user
      sessionStorage.setItem('nexora_active_user', JSON.stringify(user))
      return user
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar la cuenta'
      error.value = message
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      await repositories.auth.signOut()
    } finally {
      currentUser.value = null
      sessionStorage.removeItem('nexora_active_user')
      isLoading.value = false
    }
  }

  async function updateProfile(data: { full_name?: string; phone?: string | null; avatar_path?: string | null }): Promise<UserProfile> {
    if (!currentUser.value) {
      throw new Error('No hay usuario autenticado')
    }
    isLoading.value = true
    try {
      const updated = await repositories.auth.updateProfile(currentUser.value.id, data)
      currentUser.value = updated
      sessionStorage.setItem('nexora_active_user', JSON.stringify(updated))
      return updated
    } finally {
      isLoading.value = false
    }
  }

  function initializeFromStorage(): void {
    const raw = sessionStorage.getItem('nexora_active_user')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UserProfile
        currentUser.value = parsed
      } catch {
        sessionStorage.removeItem('nexora_active_user')
      }
    }
  }

  function setDirectUser(user: UserProfile): void {
    currentUser.value = user
    sessionStorage.setItem('nexora_active_user', JSON.stringify(user))
  }

  return {
    currentUser,
    isLoading,
    error,
    isAuthenticated,
    role,
    isAdmin,
    isEmployee,
    isStaff,
    isClient,
    login,
    register,
    logout,
    updateProfile,
    initializeFromStorage,
    setDirectUser
  }
})
