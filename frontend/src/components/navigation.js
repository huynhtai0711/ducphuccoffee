import { BarChart3, Bean, Briefcase, Coffee, Flame, LayoutDashboard, Settings, Users, Wallet, ShoppingCart } from 'lucide-react'

export const mainNavItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
  { to: '/purchases', label: 'Nhập hàng', icon: Bean, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/roast', label: 'Sản xuất', icon: Flame, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/products', label: 'Sản phẩm', icon: Coffee, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/crm', label: 'CRM', icon: Briefcase, roles: ['ADMIN', 'SALES'] },
  { to: '/sales', label: 'Bán hàng', icon: ShoppingCart, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
  { to: '/customers', label: 'Khách hàng', icon: Users, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
  { to: '/finance', label: 'Chi phí & Công nợ', icon: Wallet, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
  { to: '/reports', label: 'Báo cáo', icon: BarChart3, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
  { to: '/settings', label: 'Cài đặt', icon: Settings, roles: ['ADMIN'] },
]

export const mobileTabs = mainNavItems.slice(0, 5)
