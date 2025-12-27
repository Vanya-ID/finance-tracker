import { useState, useEffect } from 'react'
import { UserProfile } from '../types'
import { useDatabase } from './useDatabase'

const defaultProfile: UserProfile = {
  firstName: '',
  lastName: '',
}

export const useProfile = () => {
  const { saveProfileDebounced, loadProfile: loadProfileFromDB } = useDatabase()
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [loading, setLoading] = useState(true)

  // Загрузка профиля из БД
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const firebaseProfile = await loadProfileFromDB()
        if (firebaseProfile) {
          setProfile(firebaseProfile)
        } else {
          setProfile(defaultProfile)
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error)
        setProfile(defaultProfile)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [loadProfileFromDB])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const newProfile = { ...prev, ...updates }
      // Автоматическое сохранение с debounce
      saveProfileDebounced(newProfile)
      return newProfile
    })
  }

  return {
    profile,
    updateProfile,
    loading,
  }
}

