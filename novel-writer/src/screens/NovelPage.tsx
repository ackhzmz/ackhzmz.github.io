import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createChapter, getNovel, listChapters } from '../lib/db'
import type { Chapter } from '../lib/db'
import { generateId } from '../lib/id'

export function NovelPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterTitle, setChapterTitle] = useState('')

  useEffect(() => {
    async function load() {
      if (!novelId) return
      const novel = await getNovel(novelId)
      setTitle(novel?.title || '')
      setChapters(await listChapters(novelId))
    }
    load()
  }, [novelId])

  async function onCreateChapter() {
    if (!novelId || !chapterTitle.trim()) return
    const ch = await createChapter({ id: generateId('ch'), novelId, title: chapterTitle.trim(), content: '' })
    setChapterTitle('')
    setChapters(await listChapters(novelId))
    navigate(`/novel/${novelId}/editor/${ch.id}`)
  }

  return (
    <div className="mx-auto max-w-md p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">返回</button>
        <h1 className="text-xl font-bold flex-1 text-center">{title || '小说详情'}</h1>
      </div>

      <div className="space-y-2">
        <input
          className="w-full rounded border px-3 py-2 bg-transparent"
          placeholder="新章节标题"
          value={chapterTitle}
          onChange={(e) => setChapterTitle(e.target.value)}
        />
        <button className="w-full rounded bg-brand-600 text-white py-2" onClick={onCreateChapter}>
          新建章节并编辑
        </button>
      </div>

      <div className="divide-y rounded border">
        {chapters.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">暂无章节</div>
        ) : (
          chapters.map((c) => (
            <Link key={c.id} to={`/novel/${novelId}/editor/${c.id}`} className="block p-3 hover:bg-white/5">
              <div className="font-medium">{c.title}</div>
              <div className="text-xs text-gray-400">字数：{c.wordCount}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}