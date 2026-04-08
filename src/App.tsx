import { Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import SongDatabasePage from './pages/SongDatabasePage'
import OcrPage from './pages/OcrPage'

export default function App() {
  return (
    <div className="bg-black min-h-screen">
      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/editor"   element={<EditorPage />} />
        <Route path="/database" element={<SongDatabasePage />} />
        <Route path="/ocr"      element={<OcrPage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
