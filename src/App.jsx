import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { OrgProvider } from './context/OrgContext'
import PrivateRoute from './components/PrivateRoute'
import OrgRoute from './components/OrgRoute'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import OrgSelection from './pages/OrgSelection'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Members from './pages/Members'
import Organizations from './pages/Organizations'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Seats from './pages/Seats'
import Notices from './pages/Notices'
import SMS from './pages/SMS'
import Enquiries from './pages/Enquiries'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import WaitingList from './pages/WaitingList'
import NotFound from './pages/NotFound'

// Layout
import AppLayout from './components/layout/AppLayout'

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <OrgProvider>
            <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1F2933',
                color: '#F4F6F5',
              },
              success: {
                iconTheme: {
                  primary: '#2DB36C',
                  secondary: '#fff',
                },
              },
            }}
          />
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Org Selection - First page after login */}
            <Route path="/select-org" element={<PrivateRoute><OrgSelection /></PrivateRoute>} />
            
            {/* Protected Routes - Require org selection */}
            <Route element={<OrgRoute><AppLayout /></OrgRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/members" element={<Members />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/seats" element={<Seats />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/sms" element={<SMS />} />
            <Route path="/enquiries" element={<Enquiries />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/waiting-list" element={<WaitingList />} />
          </Route>
          
          {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
