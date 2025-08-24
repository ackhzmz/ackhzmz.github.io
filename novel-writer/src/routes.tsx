import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from './screens/HomePage'
import { NovelPage } from './screens/NovelPage'
import { EditorPage } from './screens/EditorPage'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/novel/:novelId', element: <NovelPage /> },
  { path: '/novel/:novelId/editor/:chapterId', element: <EditorPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}