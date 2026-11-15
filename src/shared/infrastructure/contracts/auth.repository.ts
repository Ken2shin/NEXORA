import type { UserProfile, LoginCredentials, RegisterCredentials } from '@/shared/types/user.types'

export interface IAuthRepository {
  signIn(credentials: LoginCredentials): Promise<UserProfile>
  signUp(credentials: RegisterCredentials): Promise<UserProfile>
  signOut(): Promise<void>
  getCurrentUser(): Promise<UserProfile | null>
  updateProfile(userId: string, data: { full_name?: string; phone?: string | null; avatar_path?: string | null }): Promise<UserProfile>
  resetPassword(email: string): Promise<void>
}
