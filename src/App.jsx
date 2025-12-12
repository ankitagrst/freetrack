import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { LibraryProvider } from './context/LibraryContext'
import PrivateRoute from './components/PrivateRoute'
import LibraryRoute from './components/LibraryRoute'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import LibrarySelection from './pages/LibrarySelection'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Members from './pages/Members'
import Libraries from './pages/Libraries'
import Payments from './pages/Payments'
// import Attendance from './pages/Attendance'
import Expenses from './pages/Expenses'
import Seats from './pages/Seats'
import Notices from './pages/Notices'
import SMS from './pages/SMS'
import Enquiries from './pages/Enquiries'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import WaitingList from './pages/WaitingList'

// Layout
import AppLayout from './components/layout/AppLayout'

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <LibraryProvider>
          <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#1B9AAA',
                secondary: '#fff',
              },
            },
          }}
        />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Library Selection - First page after login */}
            <Route path="/select-library" element={<PrivateRoute><LibrarySelection /></PrivateRoute>} />
            
            {/* Protected Routes - Require library selection */}
            <Route element={<LibraryRoute><AppLayout /></LibraryRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/libraries" element={<Libraries />} />
            <Route path="/members" element={<Members />} />
            <Route path="/payments" element={<Payments />} />
            {/* <Route path="/attendance" element={<Attendance />} /> */}
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
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
