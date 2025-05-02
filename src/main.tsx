import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ProfileRouting from './Pages/ProfileRouting'
import { BrowserRouter } from 'react-router'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
        <ProfileRouting />  
    </BrowserRouter>
  </StrictMode>,
)
