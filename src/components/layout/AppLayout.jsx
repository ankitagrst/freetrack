import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import ErrorBoundary from '../ErrorBoundary'
import { useAuth } from '../../context/AuthContext'
import { 
  Menu, X, LayoutDashboard, Users, CreditCard, ClipboardCheck, 
  Receipt, Sofa, Bell, MessageSquare, HelpCircle, FileText, 
  Settings, LogOut, BookOpen, Shield, MoreHorizontal
} from 'lucide-react'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  // Menu items based on user role
  const getMenuItems = () => {
    if (user?.role === 'system_admin') {
      return {
        primary: [
          { path: '/admin', icon: Shield, label: 'Dashboard' },
          { path: '/settings', icon: Settings, label: 'Settings' },
        ],
        secondary: []
      }
    }
    
    return {
      primary: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/members', icon: Users, label: 'Members' },
        { path: '/payments', icon: CreditCard, label: 'Payments' },
        { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
      ],
      secondary: [
        { path: '/expenses', icon: Receipt, label: 'Expenses' },
        { path: '/seats', icon: Sofa, label: 'Seats' },
        { path: '/notices', icon: Bell, label: 'Notices' },
        { path: '/sms', icon: MessageSquare, label: 'SMS' },
        { path: '/enquiries', icon: HelpCircle, label: 'Enquiries' },
        { path: '/plans', icon: BookOpen, label: 'Plans' },
        { path: '/reports', icon: FileText, label: 'Reports' },
        { path: '/settings', icon: Settings, label: 'Settings' },
      ]
    }
  }

  const menuItems = getMenuItems()
  const { primary: menuPrimary = [], secondary: menuSecondary = [] } = menuItems || {}
  const navRef = useRef(null)
  const allMenuItems = [...menuPrimary, ...menuSecondary]

  const isActive = (path) => location.pathname === path

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  useEffect(() => {
    const updateBottomNavVar = () => {
      const h = navRef.current ? navRef.current.clientHeight : 72
      document.documentElement.style.setProperty('--bottom-nav-height', `${h}px`)
    }
    updateBottomNavVar()
    window.addEventListener('resize', updateBottomNavVar)
    return () => window.removeEventListener('resize', updateBottomNavVar)
  }, [])

  return (
    <div style={{ '--bottom-nav-height': '72px' }} className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 z-20 md:hidden"
          style={{ bottom: 'var(--bottom-nav-height, 72px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 bg-sidebar text-sidebar-text flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">FeeTrack</h1>
              <p className="text-xs text-gray-400">{user?.libraryName || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {allMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive(item.path) 
                      ? 'bg-primary text-white' 
                      : 'text-sidebar-text hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{user?.email}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 relative">
        {/* Top Header - Mobile App Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center md:hidden">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user?.libraryName || 'FeeTrack'}</p>
              <p className="text-xs text-gray-500 hidden sm:block">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* DEV DEBUG - show user & route info on top for troubleshooting */}
            <div className="mb-4 p-3 rounded-xl bg-white shadow-sm border border-gray-100 text-xs text-gray-700 hidden md:block">
              <strong>Dev Info:</strong>
              <div>User: {user ? user.email : 'Not logged in'}</div>
              <div>Role: {user ? user.role : 'N/A'}</div>
              <div>Path: {location.pathname}</div>
            </div>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <nav ref={navRef} style={{ height: 'var(--bottom-nav-height)' }} className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom safe-area-inset pb-4 pt-2">
          <div className="flex items-center justify-around px-2 py-1">
            {menuPrimary.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg flex-1 transition-all ${
                  isActive(item.path)
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg flex-1 transition-all ${
                showMoreMenu || menuSecondary.some(item => isActive(item.path))
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </div>
        </nav>

        {/* More Menu Drawer - Mobile */}
        {showMoreMenu && (
          <>
            <div
              className="md:hidden fixed top-0 left-0 right-0 bg-black bg-opacity-50 z-20"
              style={{ bottom: 'var(--bottom-nav-height, 72px)' }}
              onClick={() => setShowMoreMenu(false)}
            />
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[60] shadow-2xl safe-area-bottom safe-area-inset pb-6 animate-slide-up overflow-hidden border-t border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">More Options</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-3">
                  {menuSecondary.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMoreMenu(false)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        isActive(item.path)
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </Link>
                  ))}
                </div>
                <button
                  onClick={logout}
                  className="mt-4 w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl animate-slide-right">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">FeeTrack</h1>
                    <p className="text-xs text-gray-500">{user?.libraryName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                  {allMenuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive(item.path)
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppLayout
