'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderKanban,
  FolderTree,
  BarChart3,
  Users,
  UsersRound,
  Tag,
  Gift,
  DollarSign,
  Globe,
  Truck,
  Radio,
  Receipt,
  CreditCard,
  Key,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  ChevronDown,
  Clock
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-ui-bg-subtle">
      {/* Sidebar */}
      <aside className={`bg-ui-bg-base border-r border-ui-border-base transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col shadow-elevation-card-rest`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-ui-border-base">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-ui-bg-interactive rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-base text-ui-fg-base">
                Shop Admin
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLink href="/" icon={<LayoutDashboard className="w-4 h-4" />} label={t.nav.dashboard} active={pathname === '/'} collapsed={!sidebarOpen} />
          <div className="h-px bg-ui-border-base my-2"></div>
          <NavLink href="/orders" icon={<ShoppingCart className="w-4 h-4" />} label={t.nav.orders} active={pathname.startsWith('/orders')} collapsed={!sidebarOpen} />
          <NavLink href="/products" icon={<Package className="w-4 h-4" />} label={t.nav.products} active={pathname.startsWith('/products')} collapsed={!sidebarOpen} />
          <NavLink href="/pending-products" icon={<Clock className="w-4 h-4 text-yellow-600" />} label={t.nav.pendingApproval} active={pathname.startsWith('/pending-products')} collapsed={!sidebarOpen} />
          <NavLink href="/collections" icon={<FolderKanban className="w-4 h-4" />} label={t.nav.collections} active={pathname.startsWith('/collections')} collapsed={!sidebarOpen} />
          <NavLink href="/categories" icon={<FolderTree className="w-4 h-4" />} label={t.nav.categories} active={pathname.startsWith('/categories')} collapsed={!sidebarOpen} />
          <NavLink href="/inventory" icon={<BarChart3 className="w-4 h-4" />} label={t.nav.inventory} active={pathname.startsWith('/inventory')} collapsed={!sidebarOpen} />
          <div className="h-px bg-ui-border-base my-2"></div>
          <NavLink href="/users" icon={<Users className="w-4 h-4" />} label={t.nav.customers} active={pathname.startsWith('/users')} collapsed={!sidebarOpen} />
          <NavLink href="/customer-groups" icon={<UsersRound className="w-4 h-4" />} label={t.nav.customerGroups} active={pathname.startsWith('/customer-groups')} collapsed={!sidebarOpen} />
          <NavLink href="/admin-users" icon={<User className="w-4 h-4 text-purple-600" />} label={t.nav.adminUsers} active={pathname.startsWith('/admin-users')} collapsed={!sidebarOpen} />
          <div className="h-px bg-ui-border-base my-2"></div>
          <NavLink href="/promotions" icon={<Tag className="w-4 h-4" />} label={t.nav.promotions} active={pathname.startsWith('/promotions')} collapsed={!sidebarOpen} />
          <NavLink href="/gift-cards" icon={<Gift className="w-4 h-4" />} label={t.nav.giftCards} active={pathname.startsWith('/gift-cards')} collapsed={!sidebarOpen} />
          <NavLink href="/pricing" icon={<DollarSign className="w-4 h-4" />} label={t.nav.pricing} active={pathname.startsWith('/pricing')} collapsed={!sidebarOpen} />
          <div className="h-px bg-ui-border-base my-2"></div>
          <NavLink href="/regions" icon={<Globe className="w-4 h-4" />} label={t.nav.regions} active={pathname.startsWith('/regions')} collapsed={!sidebarOpen} />
          <NavLink href="/shipping" icon={<Truck className="w-4 h-4" />} label={t.nav.shipping} active={pathname.startsWith('/shipping')} collapsed={!sidebarOpen} />
          <NavLink href="/sales-channels" icon={<Radio className="w-4 h-4" />} label={t.nav.salesChannels} active={pathname.startsWith('/sales-channels')} collapsed={!sidebarOpen} />
          <NavLink href="/taxes" icon={<Receipt className="w-4 h-4" />} label={t.nav.taxes} active={pathname.startsWith('/taxes')} collapsed={!sidebarOpen} />
          <div className="h-px bg-ui-border-base my-2"></div>
          <NavLink href="/payments" icon={<CreditCard className="w-4 h-4" />} label={t.nav.payments} active={pathname.startsWith('/payments')} collapsed={!sidebarOpen} />
          <NavLink href="/api-keys" icon={<Key className="w-4 h-4" />} label={t.nav.apiKeys} active={pathname.startsWith('/api-keys')} collapsed={!sidebarOpen} />
          
          <div className="pt-4 mt-4 border-t border-ui-border-base">
            <NavLink href="/settings" icon={<Settings className="w-4 h-4" />} label={t.nav.settings} active={pathname.startsWith('/settings')} collapsed={!sidebarOpen} />
          </div>
        </nav>

        {/* Toggle */}
        <div className="border-t border-ui-border-base">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full h-10 hover:bg-ui-bg-hover transition-fg flex items-center justify-center text-ui-fg-subtle hover:text-ui-fg-base"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-ui-bg-base border-b border-ui-border-base flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <button className="text-ui-fg-subtle hover:text-ui-fg-base transition-fg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <input
              id="admin-global-search"
              name="admin-global-search"
              type="text"
              placeholder="Search orders, products, customers..."
              className="w-96 px-4 py-2 border border-ui-border-base rounded-lg bg-ui-bg-component text-sm
                       focus:outline-none focus:border-ui-border-interactive focus:shadow-borders-focus
                       placeholder-ui-fg-muted transition-fg"
            />
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            <button className="p-2 text-ui-fg-subtle hover:text-ui-fg-base relative transition-fg rounded-lg hover:bg-ui-bg-hover">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-ui-bg-hover transition-fg"
              >
                <div className="w-7 h-7 bg-ui-bg-interactive rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  A
                </div>
                <span className="text-sm font-medium text-ui-fg-base">Admin</span>
                <ChevronDown className={`w-4 h-4 text-ui-fg-subtle transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-elevation-modal py-1 z-50">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-ui-fg-base hover:bg-ui-bg-hover transition-fg"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-ui-fg-base hover:bg-ui-bg-hover transition-fg"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t.nav.settings}</span>
                  </Link>
                  <div className="h-px bg-ui-border-base my-1"></div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-fg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.logout}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-ui-bg-subtle">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ href, icon, label, active, collapsed }: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-fg text-sm ${
        active
          ? 'bg-ui-bg-interactive text-ui-fg-on-color shadow-sm font-medium'
          : 'text-ui-fg-subtle hover:bg-ui-bg-hover hover:text-ui-fg-base'
      } ${
        collapsed ? 'justify-center' : ''
      }`}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
