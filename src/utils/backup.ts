import { DataSnapshot, createSnapshot, restoreSnapshot } from '../services/localStore'

export const downloadBackup = (): void => {
  const snapshot = createSnapshot()
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date(snapshot.exportedAt).toISOString().slice(0, 10)

  const link = document.createElement('a')
  link.href = url
  link.download = `finance-tracker-${date}.json`
  link.click()

  URL.revokeObjectURL(url)
}

export const uploadBackup = async (file: File): Promise<void> => {
  const text = await file.text()

  let snapshot: DataSnapshot
  try {
    snapshot = JSON.parse(text) as DataSnapshot
  } catch (error) {
    throw new Error('Не удалось прочитать файл: он повреждён или это не JSON')
  }

  restoreSnapshot(snapshot)
}
