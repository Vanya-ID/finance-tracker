import { supabase } from './supabase'
import {
  SYNCED_KEYS,
  StorageKey,
  getUpdatedAt,
  onStorageWrite,
  readStorage,
  writeStorage,
} from './localStore'

export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error'

export type SyncState = {
  status: SyncStatus
  lastSyncAt: number | null
  error: string | null
}

const SYNC_TIMEOUT_MS = 10000
const PUSH_DEBOUNCE_MS = 2000

let state: SyncState = { status: 'signed-out', lastSyncAt: null, error: null }
let applyingRemote = false
let pushTimeout: ReturnType<typeof setTimeout> | null = null

const stateListeners = new Set<(state: SyncState) => void>()

const setState = (patch: Partial<SyncState>): void => {
  state = { ...state, ...patch }
  stateListeners.forEach((listener) => listener(state))
}

export const getSyncState = (): SyncState => state

export const onSyncStateChange = (listener: (state: SyncState) => void): (() => void) => {
  stateListeners.add(listener)
  return () => {
    stateListeners.delete(listener)
  }
}

const withTimeout = <T>(promise: PromiseLike<T>, label: string): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: превышено время ожидания`)), SYNC_TIMEOUT_MS)
    ),
  ])
}

const getUserId = async (): Promise<string | null> => {
  if (!supabase) {
    return null
  }

  const { data } = await withTimeout(supabase.auth.getSession(), 'Проверка сессии')
  return data.session?.user.id ?? null
}

const describeError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error)

  if (/Failed to fetch|NetworkError|время ожидания|aborted|timed out|TimeoutError/i.test(message)) {
    return 'База данных недоступна (возможно, проект Supabase на паузе). Данные сохранены локально.'
  }

  if (/relation .*user_data.* does not exist|schema cache/i.test(message)) {
    return 'Таблица user_data не найдена — выполните supabase_schema.sql в Supabase SQL Editor.'
  }

  return message
}

type RemoteRow = {
  key: string
  payload: unknown
  updated_at: number
}

export const sync = async (): Promise<{ changed: boolean }> => {
  let userId: string | null = null

  try {
    userId = await getUserId()
  } catch (error) {
    console.error('Ошибка синхронизации:', error)
    setState({ status: 'error', error: describeError(error) })
    return { changed: false }
  }

  if (!userId || !supabase) {
    setState({ status: 'signed-out', error: null })
    return { changed: false }
  }

  setState({ status: 'syncing', error: null })

  try {
    const { data, error } = await withTimeout(
      supabase.from('user_data').select('key, payload, updated_at').eq('user_id', userId),
      'Загрузка данных'
    )

    if (error) {
      throw error
    }

    const remoteRows = (data ?? []) as RemoteRow[]
    const remoteByKey = new Map(remoteRows.map((row) => [row.key, row]))

    let changed = false
    const toPush: Array<{ user_id: string; key: string; payload: unknown; updated_at: number }> = []

    applyingRemote = true
    try {
      SYNCED_KEYS.forEach((key) => {
        const localUpdatedAt = getUpdatedAt(key)
        const localValue = readStorage<unknown>(key, null)
        const remote = remoteByKey.get(key)

        if (remote && remote.updated_at > localUpdatedAt) {
          writeStorage(key, remote.payload, remote.updated_at)
          changed = true
          return
        }

        const hasLocalValue = localValue !== null
        const isNewerLocally = !remote || localUpdatedAt > remote.updated_at

        if (hasLocalValue && isNewerLocally) {
          toPush.push({
            user_id: userId,
            key,
            payload: localValue,
            updated_at: localUpdatedAt || Date.now(),
          })
        }
      })
    } finally {
      applyingRemote = false
    }

    if (toPush.length > 0) {
      const { error: upsertError } = await withTimeout(
        supabase.from('user_data').upsert(toPush, { onConflict: 'user_id,key' }),
        'Сохранение данных'
      )

      if (upsertError) {
        throw upsertError
      }
    }

    setState({ status: 'idle', lastSyncAt: Date.now(), error: null })
    return { changed }
  } catch (error) {
    console.error('Ошибка синхронизации:', error)
    setState({ status: 'error', error: describeError(error) })
    return { changed: false }
  }
}

const schedulePush = (): void => {
  if (applyingRemote) {
    return
  }

  if (pushTimeout) {
    clearTimeout(pushTimeout)
  }

  pushTimeout = setTimeout(() => {
    pushTimeout = null
    void sync()
  }, PUSH_DEBOUNCE_MS)
}

export const startAutoSync = (): (() => void) => {
  const unsubscribeStorage = onStorageWrite((_key: StorageKey) => {
    schedulePush()
  })

  if (!supabase) {
    return unsubscribeStorage
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      setState({ status: 'signed-out', lastSyncAt: null, error: null })
      return
    }

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      void sync()
    }
  })

  return () => {
    unsubscribeStorage()
    subscription.unsubscribe()
    if (pushTimeout) {
      clearTimeout(pushTimeout)
      pushTimeout = null
    }
  }
}

export const flushPendingPush = async (): Promise<void> => {
  if (pushTimeout) {
    clearTimeout(pushTimeout)
    pushTimeout = null
    await sync()
  }
}
