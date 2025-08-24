import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createNovel, listNovels } from '../lib/db'
import type { Novel } from '../lib/db'
import { generateId } from '../lib/id'

export function HomePage() {
  const navigate = useNavigate()
  const [novels, setNovels] = useState<Novel[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    listNovels().then(setNovels)
  }, [])

  async function onCreate() {
    if (!title.trim()) return
    const novel = await createNovel({ id: generateId('novel'), title: title.trim(), description: desc.trim() })
    setTitle('')
    setDesc('')
    setNovels(await listNovels())
    navigate(`/novel/${novel.id}`)
  }

  return (
    <div className="mx-auto max-w-md p-4 space-y-4">
      <h1 className="text-2xl font-bold">我的小说</h1>

      <div className="space-y-2">
        <input
          className="w-full rounded border px-3 py-2 bg-transparent"
          placeholder="小说标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded border px-3 py-2 bg-transparent min-h-20"
          placeholder="简介（可选）"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button className="w-full rounded bg-brand-600 text-white py-2" onClick={onCreate}>
          新建小说
        </button>
      </div>

      <div className="divide-y rounded border">
        {novels.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">暂无作品，创建一个吧</div>
        ) : (
          novels.map((n) => (
            <Link key={n.id} to={`/novel/${n.id}`} className="block p-3 hover:bg-white/5">
              <div className="font-medium">{n.title}</div>
              {n.description && <div className="text-sm text-gray-400 line-clamp-2">{n.description}</div>}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}