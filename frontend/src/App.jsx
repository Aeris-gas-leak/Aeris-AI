import { useLayoutEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home        from './pages/Home.jsx'
import Landing     from './pages/Landing.jsx'
import Dashboard   from './pages/Dashboard.jsx'
import RoomDetail  from './pages/RoomDetail.jsx'
import Immediate   from './pages/Immediate.jsx'
import Alerts      from './pages/Alerts.jsx'
import About       from './pages/About.jsx'

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
        <Route path="/"               element={<Landing />} />
        <Route path="/app"            element={<Home />} />
        <Route path="/rooms"          element={<Dashboard />} />
        <Route path="/room/:roomName" element={<RoomDetail />} />
        <Route path="/immediate"      element={<Immediate />} />
        <Route path="/alerts"         element={<Alerts />} />
        <Route path="/about"          element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
