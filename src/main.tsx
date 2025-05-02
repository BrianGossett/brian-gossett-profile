import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ProfileRouting from './Pages/ProfileRouting'
import { BrowserRouter } from 'react-router'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from './Theme'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ChakraProvider value={system}>
        <ProfileRouting />  
      </ChakraProvider>
    </BrowserRouter>
  </StrictMode>,
)
