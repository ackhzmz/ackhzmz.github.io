import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNovel, updateChapter, listChapters } from '../lib/db'

export function EditorPage() {
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>()
  const navigate = useNavigate()
  const [novelTitle, setNovelTitle] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const wordCount = useMemo(() => {
    const chinese = content.replace(/\s/g, '').match(/[\u4e00-\u9fa5]/g)?.length || 0
    const english = content.trim().split(/\s+/).filter(Boolean).length
    return chinese + english
  }, [content])

  useEffect(() => {
    async function load() {
      if (!novelId || !chapterId) return
      const novel = await getNovel(novelId)
      setNovelTitle(novel?.title || '')
      const ch = (await listChapters(novelId)).find((c) => c.id === chapterId)
      if (ch) {
        setTitle(ch.title)
        setContent(ch.content)
      }
    }
    load()
  }, [novelId, chapterId])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (chapterId) updateChapter(chapterId, { title, content })
    }, 400)
    return () => clearTimeout(handler)
  }, [chapterId, title, content])

  return (
    <div className="mx-auto max-w-md p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">返回</button>
        <h1 className="text-xl font-bold flex-1 text-center">{novelTitle || '编辑章节'}</h1>
      </div>

      <input
        className="w-full rounded border px-3 py-2 bg-transparent"
        placeholder="章节标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full rounded border px-3 py-2 bg-transparent min-h-[50vh]"
        placeholder="开始写作... 支持 Markdown 语法"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="text-right text-xs text-gray-500">字数：{wordCount}</div>
    </div>
  )
}