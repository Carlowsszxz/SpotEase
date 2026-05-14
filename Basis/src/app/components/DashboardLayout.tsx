import { Outlet, NavLink } from "react-router";
import { Activity, BarChart3, Database, Layers } from "lucide-react";

export function DashboardLayout() {
  return (
    <div className="h-screen bg-black overflow-hidden flex">
      {/* Sidebar */}
      <aside className="w-16 bg-zinc-900 flex flex-col items-center py-8 gap-6 border-r border-zinc-800">
        {/* Logo */}
        <div className="w-8 h-8 bg-red-600 rounded" />

        {/* Nav Icons */}
        <nav className="flex flex-col gap-4 flex-1">
          <NavLink to="/" end>
            {({ isActive }) => (
              <div className={`p-2 rounded transition-colors ${
                isActive ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
            )}
          </NavLink>

          <NavLink to="/analytics">
            {({ isActive }) => (
              <div className={`p-2 rounded transition-colors ${
                isActive ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
                <BarChart3 className="w-5 h-5" />
              </div>
            )}
          </NavLink>

          <NavLink to="/system">
            {({ isActive }) => (
              <div className={`p-2 rounded transition-colors ${
                isActive ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
            )}
          </NavLink>

          <NavLink to="/stream">
            {({ isActive }) => (
              <div className={`p-2 rounded transition-colors ${
                isActive ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
                <Database className="w-5 h-5" />
              </div>
            )}
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}