import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PackagePlus, PackageMinus,
  Boxes, ClipboardList, LogOut, Menu, X, Package, FolderKanban, BarChart2,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { to: '/inbound',   icon: PackagePlus,     label: '입고 등록' },
  { to: '/outbound',  icon: PackageMinus,    label: '출고 등록' },
  { to: '/items',     icon: Package,         label: '품목 관리' },
  { to: '/stock',     icon: Boxes,           label: '재고 목록' },
  { to: '/projects',  icon: FolderKanban,    label: '프로젝트 현황' },
  { to: '/stats',     icon: BarChart2,       label: '통계' },
  { to: '/history',   icon: ClipboardList,   label: '이력 조회' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 bg-[#1E3A8A] text-white flex flex-col
          transform transition-transform duration-200
          ${sideOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-blue-800">
          <div>
            <p className="text-xs font-semibold text-blue-300 tracking-widest uppercase">UBICOM</p>
            <p className="text-lg font-bold leading-tight">IMS</p>
            <p className="text-xs text-blue-300">재고관리 시스템</p>
          </div>
          <button className="lg:hidden" onClick={() => setSideOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSideOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setSideOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <span className="font-bold text-[#1E3A8A]">UBICOM IMS</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
