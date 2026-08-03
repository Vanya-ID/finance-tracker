export const STORAGE_KEYS = {
  financialData: 'finance-tracker-financial-data',
  profile: 'finance-tracker-profile',
  settings: 'finance-tracker-settings',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export const SYNCED_KEYS: StorageKey[] = Object.values(STORAGE_KEYS)

const META_KEY = 'finance-tracker-updated-at'

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

const readMeta = (): Record<string, number> => {
  const storage = getStorage()
  if (!storage) {
    return {}
  }

  try {
    const raw = storage.getItem(META_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch (error) {
    console.error('Ошибка чтения меток времени:', error)
    return {}
  }
}

const writeMeta = (meta: Record<string, number>): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(META_KEY, JSON.stringify(meta))
  } catch (error) {
    console.error('Ошибка записи меток времени:', error)
  }
}

export const getUpdatedAt = (key: StorageKey): number => {
  return readMeta()[key] ?? 0
}

export const setUpdatedAt = (key: StorageKey, updatedAt: number): void => {
  writeMeta({ ...readMeta(), [key]: updatedAt })
}

export const readStorage = <T>(key: StorageKey, fallback: T): T => {
  const storage = getStorage()
  if (!storage) {
    return fallback
  }

  try {
    const raw = storage.getItem(key)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch (error) {
    console.error(`Ошибка чтения localStorage по ключу "${key}":`, error)
    return fallback
  }
}

const listeners = new Set<(key: StorageKey) => void>()

export const onStorageWrite = (listener: (key: StorageKey) => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const writeStorage = <T>(key: StorageKey, value: T, updatedAt: number = Date.now()): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Ошибка записи localStorage по ключу "${key}":`, error)
    throw error
  }

  setUpdatedAt(key, updatedAt)
  listeners.forEach((listener) => listener(key))
}

export type DataSnapshot = {
  version: 1
  exportedAt: number
  updatedAt: Record<string, number>
  data: Record<string, unknown>
}

export const createSnapshot = (): DataSnapshot => {
  const meta = readMeta()
  const data: Record<string, unknown> = {}

  SYNCED_KEYS.forEach((key) => {
    const value = readStorage<unknown>(key, null)
    if (value !== null) {
      data[key] = value
    }
  })

  return {
    version: 1,
    exportedAt: Date.now(),
    updatedAt: meta,
    data,
  }
}

export const restoreSnapshot = (snapshot: DataSnapshot): void => {
  if (!snapshot || snapshot.version !== 1 || typeof snapshot.data !== 'object') {
    throw new Error('Файл не похож на резервную копию finance-tracker')
  }

  SYNCED_KEYS.forEach((key) => {
    if (key in snapshot.data) {
      const updatedAt = snapshot.updatedAt?.[key] ?? snapshot.exportedAt ?? Date.now()
      writeStorage(key, snapshot.data[key], updatedAt)
    }
  })
}
