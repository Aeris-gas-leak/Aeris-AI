import { useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Landing         from './pages/Landing.jsx'
import AppLayout       from './components/AppLayout.jsx'
import Recorder        from './pages/Recorder.jsx'
import Recordings      from './pages/Recordings.jsx'
import RecordingDetail from './pages/RecordingDetail.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Recorder />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="recordings/:id" element={<RecordingDetail />} />
        </Route>
        {/* Older links from the first prototype. */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
