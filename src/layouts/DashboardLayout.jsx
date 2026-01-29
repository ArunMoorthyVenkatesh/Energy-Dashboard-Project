import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Home, Settings, Menu, X } from "lucide-react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setTopbarTitle] = useState("");
  const [activePage, setActivePage] = useState(location.pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update active page when route changes
  useEffect(() => {
    setActivePage(location.pathname);
  }, [location.pathname]);

  function onClickPage(url) {
    setActivePage(url);
    navigate(url);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div 
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm`}
      >
        {/* Header with Logo and Toggle */}
        <div className="h-32 border-b border-gray-200 flex items-center justify-center px-4 relative">
          {!isCollapsed && (
            <div className="flex items-center justify-center flex-1">
              <img 
                src={`${process.env.PUBLIC_URL}/semply-logo.jpg`}
                alt="SEMPLY" 
                className="h-24 w-auto object-contain"
                onError={(e) => {
                  console.error('Logo failed to load from:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 ${
              isCollapsed ? "" : "absolute right-4"
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => onClickPage("/iot-dashboard")}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-lg transition-colors font-medium text-sm ${
              activePage === "/iot-dashboard"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            title={isCollapsed ? "Home" : ""}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </button>

          <button
            onClick={() => onClickPage("/iot-dashboard/devices")}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-lg transition-colors font-medium text-sm ${
              activePage === "/iot-dashboard/devices"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            title={isCollapsed ? "Device Management" : ""}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Device Management</span>}
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200">
          {isCollapsed ? (
            <div 
              className="w-10 h-10 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
              title="User Profile"
            >
              M
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                M
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">My Name</p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <Outlet context={{ setTopbarTitle }} />
      </div>
    </div>
  );
}