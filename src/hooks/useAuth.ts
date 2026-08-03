import { useCallback, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import {
  getSessionUser,
  onAuthStateChanged,
  signInWithPassword,
  signOut as signOutFromSupabase,
  signUpWithPassword,
} from '../services/supabaseAuthService'
import { SyncState, getSyncState, onSyncStateChange, sync } from '../services/supabaseSyncService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState<SyncState>(getSyncState())

  useEffect(() => {
    let mounted = true

    getSessionUser()
      .then((sessionUser) => {
        if (mounted) {
          setUser(sessionUser)
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    const unsubscribeAuth = onAuthStateChanged((nextUser) => {
      setUser(nextUser)
    })

    const unsubscribeSync = onSyncStateChange(setSyncState)

    return () => {
      mounted = false
      unsubscribeAuth()
      unsubscribeSync()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const signedInUser = await signInWithPassword(email, password)
    setUser(signedInUser)
    return sync()
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const createdUser = await signUpWithPassword(email, password)
    setUser(createdUser)
    return createdUser
  }, [])

  const signOut = useCallback(async () => {
    await signOutFromSupabase()
    setUser(null)
  }, [])

  const syncNow = useCallback(() => sync(), [])

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    syncState,
    signIn,
    signUp,
    signOut,
    syncNow,
  }
}
