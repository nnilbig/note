import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BoardSnapshot, PendingCard } from '~/types/card'

interface WhonextDB extends DBSchema {
  'board-snapshot': { key: string, value: BoardSnapshot }
  'pending-cards': { key: string, value: PendingCard, indexes: { 'by-userId': string } }
}

let dbPromise: Promise<IDBPDatabase<WhonextDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<WhonextDB>('whonext-offline', 1, {
      upgrade(db) {
        db.createObjectStore('board-snapshot', { keyPath: 'userId' })
        const store = db.createObjectStore('pending-cards', { keyPath: 'localId' })
        store.createIndex('by-userId', 'userId')
      }
    })
  }
  return dbPromise
}

export async function saveBoardSnapshot(snapshot: BoardSnapshot) {
  await (await getDb()).put('board-snapshot', snapshot)
}

export async function loadBoardSnapshot(userId: string) {
  return (await getDb()).get('board-snapshot', userId)
}

export async function enqueuePendingCard(entry: PendingCard) {
  await (await getDb()).put('pending-cards', entry)
}

export async function listPendingCards(userId: string) {
  return (await getDb()).getAllFromIndex('pending-cards', 'by-userId', userId)
}

export async function removePendingCard(localId: string) {
  await (await getDb()).delete('pending-cards', localId)
}

export async function markPendingCardFailed(localId: string, message: string) {
  const db = await getDb()
  const entry = await db.get('pending-cards', localId)
  if (entry) await db.put('pending-cards', { ...entry, status: 'failed', lastError: message })
}
