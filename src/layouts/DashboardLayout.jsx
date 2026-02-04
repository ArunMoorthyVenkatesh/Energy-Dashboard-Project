import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Home, Settings, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setTopbarTitle] = useState("");
  const [activePage, setActivePage] = useState(location.pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActivePage(location.pathname);
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Auto-collapse sidebar on tablet/small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onClickPage(url) {
    setActivePage(url);
    navigate(url);
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-slate-700"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Premium Sidebar */}
      <div 
        className={`
          ${isCollapsed ? "lg:w-20" : "lg:w-72"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          fixed lg:relative
          inset-y-0 left-0
          w-72 max-w-[80vw]
          bg-white/60 backdrop-blur-xl 
          border-r border-slate-200/60 
          flex flex-col 
          transition-all duration-300 
          shadow-xl 
          z-40
        `}
      >
        {/* Refined Header with Logo */}
        <div className="h-24 lg:h-32 border-b border-slate-200/60 flex items-center justify-center px-4 lg:px-6 relative flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center justify-center flex-1">
              <img 
                src={`${process.env.PUBLIC_URL}/semply-logo.jpg`}
                alt="SEMPLY" 
                className="h-16 lg:h-24 w-auto object-contain opacity-90 mix-blend-multiply"
                onError={(e) => {
                  console.error('Logo failed to load from:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Elegant Toggle Button - Hidden on mobile */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:block p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-300 text-slate-600 hover:text-slate-900 shadow-sm hover:shadow-md group ${
              isCollapsed ? "mx-auto" : "absolute right-4"
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        {/* Refined Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => onClickPage("/iot-dashboard")}
            className={`w-full flex items-center ${
              isCollapsed ? "lg:justify-center lg:px-4" : "gap-3 lg:gap-4"
            } px-4 lg:px-5 py-3 lg:py-4 rounded-2xl transition-all duration-300 font-semibold text-sm group relative overflow-hidden ${
              activePage === "/iot-dashboard" || activePage === "/iot-dashboard/"
                ? "bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-900/20"
                : "text-slate-700 hover:bg-slate-50 hover:shadow-md"
            }`}
            title={isCollapsed ? "Home" : ""}
          >
            {/* Hover effect overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
              activePage === "/iot-dashboard" || activePage === "/iot-dashboard/" ? "hidden" : ""
            }`}></div>
            
            <div className={`relative flex items-center ${isCollapsed ? "lg:justify-center" : "gap-3 lg:gap-4"} w-full`}>
              <Home className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                activePage === "/iot-dashboard" || activePage === "/iot-dashboard/" ? "" : "group-hover:text-white"
              }`} />
              {!isCollapsed && (
                <span className={`transition-colors ${
                  activePage === "/iot-dashboard" || activePage === "/iot-dashboard/" ? "" : "group-hover:text-white"
                }`}>
                  Home
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => onClickPage("/iot-dashboard/devices")}
            className={`w-full flex items-center ${
              isCollapsed ? "lg:justify-center lg:px-4" : "gap-3 lg:gap-4"
            } px-4 lg:px-5 py-3 lg:py-4 rounded-2xl transition-all duration-300 font-semibold text-sm group relative overflow-hidden ${
              activePage === "/iot-dashboard/devices" || activePage === "/iot-dashboard/devices/"
                ? "bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-700 hover:bg-slate-50 hover:shadow-md"
            }`}
            title={isCollapsed ? "Device Management" : ""}
          >
            {/* Hover effect overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
              activePage === "/iot-dashboard/devices" || activePage === "/iot-dashboard/devices/" ? "hidden" : ""
            }`}></div>
            
            <div className={`relative flex items-center ${isCollapsed ? "lg:justify-center" : "gap-3 lg:gap-4"} w-full`}>
              <Settings className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                activePage === "/iot-dashboard/devices" || activePage === "/iot-dashboard/devices/" ? "" : "group-hover:text-white"
              }`} />
              {!isCollapsed && (
                <span className={`transition-colors ${
                  activePage === "/iot-dashboard/devices" || activePage === "/iot-dashboard/devices/" ? "" : "group-hover:text-white"
                }`}>
                  Device Management
                </span>
              )}
            </div>
          </button>
        </nav>

        {/* Premium User Profile Section */}
        <div className="p-3 lg:p-4 border-t border-slate-200/60 bg-gradient-to-br from-white/50 to-slate-50/30 flex-shrink-0">
          {isCollapsed ? (
            <div 
              className="w-12 h-12 mx-auto bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-110 shadow-lg"
              title="User Profile"
            >
              M
            </div>
          ) : (
            <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md group-hover:shadow-xl transition-shadow">
                M
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">My Name</p>
                <p className="text-xs text-slate-500 font-medium truncate">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area with refined background */}
      <div className="flex-1 w-full lg:w-auto overflow-auto pt-16 lg:pt-0">
        <Outlet context={{ setTopbarTitle }} />
      </div>
    </div>
  );
}