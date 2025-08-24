import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import { z } from 'zod'

export const novelSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type Novel = z.infer<typeof novelSchema>

export const chapterSchema = z.object({
  id: z.string(),
  novelId: z.string(),
  title: z.string().min(1),
  content: z.string().default(''),
  wordCount: z.number().default(0),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type Chapter = z.infer<typeof chapterSchema>

interface NovelDB extends DBSchema {
  novels: {
    key: string
    value: Novel
    indexes: { 'by-updatedAt': number }
  }
  chapters: {
    key: string
    value: Chapter
    indexes: { 'by-novelId': string; 'by-updatedAt': number }
  }
}

let dbPromise: Promise<IDBPDatabase<NovelDB>> | null = null

export function getDb(): Promise<IDBPDatabase<NovelDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NovelDB>('novel-writer-db', 1, {
      upgrade(db) {
        const novels = db.createObjectStore('novels', { keyPath: 'id' })
        novels.createIndex('by-updatedAt', 'updatedAt')

        const chapters = db.createObjectStore('chapters', { keyPath: 'id' })
        chapters.createIndex('by-novelId', 'novelId')
        chapters.createIndex('by-updatedAt', 'updatedAt')
      },
    })
  }
  return dbPromise
}

export async function createNovel(input: Pick<Novel, 'id' | 'title' | 'description'>): Promise<Novel> {
  const now = Date.now()
  const novel: Novel = novelSchema.parse({ ...input, createdAt: now, updatedAt: now })
  const db = await getDb()
  await db.put('novels', novel)
  return novel
}

export async function updateNovel(id: string, patch: Partial<Omit<Novel, 'id' | 'createdAt'>>): Promise<Novel> {
  const db = await getDb()
  const old = await db.get('novels', id)
  if (!old) throw new Error('Novel not found')
  const novel = novelSchema.parse({ ...old, ...patch, updatedAt: Date.now() })
  await db.put('novels', novel)
  return novel
}

export async function deleteNovel(id: string): Promise<void> {
  const db = await getDb()
  // delete chapters first
  const tx = db.transaction(['chapters', 'novels'], 'readwrite')
  const chaptersStore = tx.objectStore('chapters')
  const idx = chaptersStore.index('by-novelId')
  for await (const cursor of idx.iterate(id)) {
    await cursor.delete()
  }
  await tx.objectStore('novels').delete(id)
  await tx.done
}

export async function listNovels(): Promise<Novel[]> {
  const db = await getDb()
  const all = await db.getAll('novels')
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getNovel(id: string): Promise<Novel | undefined> {
  const db = await getDb()
  return db.get('novels', id)
}

export async function createChapter(input: Pick<Chapter, 'id' | 'novelId' | 'title' | 'content'>): Promise<Chapter> {
  const now = Date.now()
  const chapter: Chapter = chapterSchema.parse({
    ...input,
    wordCount: countWords(input.content || ''),
    createdAt: now,
    updatedAt: now,
  })
  const db = await getDb()
  await db.put('chapters', chapter)
  await updateNovel(input.novelId, {})
  return chapter
}

export async function updateChapter(id: string, patch: Partial<Omit<Chapter, 'id' | 'novelId' | 'createdAt'>>): Promise<Chapter> {
  const db = await getDb()
  const old = await db.get('chapters', id)
  if (!old) throw new Error('Chapter not found')
  const merged = { ...old, ...patch }
  merged.wordCount = countWords(merged.content || '')
  merged.updatedAt = Date.now()
  const chapter = chapterSchema.parse(merged)
  await db.put('chapters', chapter)
  await updateNovel(chapter.novelId, {})
  return chapter
}

export async function deleteChapter(id: string): Promise<void> {
  const db = await getDb()
  const chapter = await db.get('chapters', id)
  if (!chapter) return
  await db.delete('chapters', id)
  await updateNovel(chapter.novelId, {})
}

export async function listChapters(novelId: string): Promise<Chapter[]> {
  const db = await getDb()
  const tx = db.transaction('chapters', 'readonly')
  const idx = tx.store.index('by-novelId')
  const chapters = await idx.getAll(novelId)
  await tx.done
  return chapters.sort((a, b) => a.createdAt - b.createdAt)
}

function countWords(text: string): number {
  if (!text) return 0
  // 粗略统计：中文字符数 + 英文词数
  const chinese = text.replace(/\s/g, '').match(/[\u4e00-\u9fa5]/g)?.length || 0
  const english = text.trim().split(/\s+/).filter(Boolean).length
  return chinese + english
}