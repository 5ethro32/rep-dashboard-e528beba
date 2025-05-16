import React from "react";
import {
  BarChartHorizontal,
  Bot,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Cpu,
  FlaskConical,
  LayoutDashboard,
  TrendingUp,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface NavItemProps {
  name: string;
  href: string;
  Icon: React.ComponentType<any>;
}

// Update the navigation items to include all Engine Room links
const navigation = [
  { name: "Dashboard", href: "/", Icon: LayoutDashboard },
  { name: "Rep Performance", href: "/rep-performance", Icon: Users },
  { name: "Account Performance", href: "/account-performance", Icon: Building2 },
  { name: "My Performance", href: "/my-performance", Icon: BarChartHorizontal },
  { name: "Rep Planner", href: "/rep-tracker", Icon: CalendarDays },
  { name: "Engine Room", href: "/engine-room", Icon: Cpu },
  { name: "Engine Dashboard", href: "/engine-room/dashboard", Icon: LayoutDashboard },
  { name: "Engine Operations", href: "/engine-room/operations", Icon: ClipboardList },
  { name: "Rule Simulator", href: "/engine-room/simulator", Icon: FlaskConical },
  { name: "Approvals", href: "/engine-room/approvals", Icon: CheckSquare },
  { name: "Pricing Analytics", href: "/engine-room/analytics", Icon: TrendingUp },
  { name: "AI Vera", href: "/ai-vera", Icon: Bot },
];

const AppSidebar: React.FC = () => {
  return (
    <aside className="hidden md:block w-64 flex-shrink-0 bg-gray-950/80 backdrop-blur-sm border-r border-white/5 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-lg font-bold mb-4">REVA Platform</h1>
        <nav className="space-y-2">
          {navigation.map((item: NavItemProps) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                }`
              }
            >
              <item.Icon className="mr-2 h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
