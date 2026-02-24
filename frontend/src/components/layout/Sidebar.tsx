import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Megaphone,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSyncStore } from "@/stores/syncStore";
import { useUIStore } from "@/stores/uiStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["all"], end: true },
  { to: "/inventory/raw-materials", label: "Raw Materials", icon: Package, roles: ["factory_supervisor", "admin"] },
  { to: "/inventory/production", label: "Production", icon: Package, roles: ["factory_supervisor", "admin"] },
  { to: "/inventory/finished-goods", label: "Finished Goods", icon: Package, roles: ["factory_supervisor", "sales_manager", "admin"] },
  { to: "/inventory/transfers", label: "Transfers", icon: Package, roles: ["factory_supervisor", "sales_manager", "admin"] },
  { to: "/sales/customers", label: "Customers", icon: ShoppingCart, roles: ["sales_manager", "admin"] },
  { to: "/sales/orders", label: "Orders", icon: ShoppingCart, roles: ["sales_manager", "admin"] },
  { to: "/sales/daily-log", label: "Sales Log", icon: ShoppingCart, roles: ["sales_manager", "admin"] },
  { to: "/marketing/campaigns", label: "Campaigns", icon: Megaphone, roles: ["marketer", "admin"] },
  { to: "/marketing/feedback", label: "Feedback", icon: Megaphone, roles: ["marketer", "customer_care", "admin"] },
  { to: "/asal/daily-log", label: "Daily Log", icon: ClipboardList, roles: ["all"] },
  { to: "/asal/weekly-plan", label: "Weekly Plan", icon: ClipboardList, roles: ["all"] },
  { to: "/asal/weekly-report", label: "Weekly Report", icon: ClipboardList, roles: ["all"] },
  { to: "/disciplinary", label: "Disciplinary", icon: AlertTriangle, roles: ["admin", "hr_management"] },
  { to: "/kpi", label: "KPI Dashboard", icon: BarChart3, roles: ["admin", "hr_management", "sales_manager"] },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const { isOnline } = useSyncStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const filteredNav = navItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(user?.role ?? "")
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">BonneSante</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Online Status */}
      <div className={`mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
        isOnline ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
      }`}>
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        {!sidebarCollapsed && (isOnline ? "Online" : "Offline")}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-200 p-3">
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role?.replace("_", " ")}</p>
          </div>
        )}
        <button
          onClick={clearAuth}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
          {!sidebarCollapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
