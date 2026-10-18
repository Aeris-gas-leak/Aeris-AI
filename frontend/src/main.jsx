import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Chart } from 'chart.js'
import './styles/app.css'
import App from './App.jsx'

Chart.defaults.font.family = "'DM Sans', sans-serif"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
