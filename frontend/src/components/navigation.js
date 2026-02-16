import { BarChart3, Bean, Boxes, Coffee, Flame, LayoutDashboard, Settings, Users } from 'lucide-react'

export const mainNavItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: ['ADMIN', 'WAREHOUSE', 'SALES_CRM'] },
  { to: '/purchases', label: 'Nhập hàng', icon: Bean, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/roast', label: 'Rang', icon: Flame, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/sales', label: 'Bán hàng', icon: BarChart3, roles: ['ADMIN', 'WAREHOUSE', 'SALES_CRM'] },
  { to: '/crm', label: 'CRM', icon: Users, roles: ['ADMIN', 'SALES_CRM'] },
  { to: '/products', label: 'Sản phẩm', icon: Coffee, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/settings', label: 'Thiết lập', icon: Settings, roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/system-update', label: 'Hệ thống', icon: Boxes, roles: ['ADMIN'] },
]

export const mobileTabs = mainNavItems.slice(0, 5)
