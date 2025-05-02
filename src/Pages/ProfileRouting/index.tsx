// make a router for the app
import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'


const ProfileRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/examples" element={<ExamplePage />} />
            <Route path="*" element={<div style={{   
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                width: '100vw',
                height: '100vh',
            }}>404 Not Found</div>} />
        </Routes>
    )
    }
    
export default ProfileRouting