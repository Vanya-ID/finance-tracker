type LocalUser = {
  id: string
  email?: string
}

export const useAuth = () => {
  const user: LocalUser = { id: 'local-user' }

  const login = async (): Promise<LocalUser> => {
    return user
  }

  const logout = async (): Promise<void> => {
    return
  }

  return {
    user,
    loading: false,
    login,
    logout,
    isAuthenticated: true,
  }
}

