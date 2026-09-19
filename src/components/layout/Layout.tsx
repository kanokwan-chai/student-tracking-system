import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, ClipboardList, LogOut, Menu, X, Award } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'student' ? [
    { to: '/student', icon: LayoutDashboard, label: 'หน้าหลัก' },
    { to: '/student/subjects', icon: BookOpen, label: 'วิชาเรียน' },
    { to: '/student/assignments', icon: ClipboardList, label: 'งานของฉัน' },
    { to: '/student/quizzes', icon: Award, label: 'คะแนนสอบย่อย' },
  ] : [
    { to: '/teacher', icon: LayoutDashboard, label: 'หน้าหลัก' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between p-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
          <span className="font-bold text-slate-800 text-sm tracking-tight">ติดตามผลการเรียนรายบุคคล</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay Drawer */}
      <aside className={clsx(
        "fixed md:static inset-y-0 left-0 transform md:transform-none transition-transform duration-300 ease-in-out bg-white/95 backdrop-blur-md w-72 border-r border-slate-200/70 shadow-lg md:shadow-none z-40 flex flex-col justify-between",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div>
          {/* Brand Header */}
          <div className="p-6 hidden md:flex items-center gap-3.5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-50 to-blue-50 border border-indigo-100/60 p-1 flex items-center justify-center shadow-xs">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 leading-snug tracking-tight">ติดตามผลการเรียน</h1>
              <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase">รายบุคคล</span>
            </div>
          </div>

          <div className="px-4 py-4 md:hidden border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">เมนูระบบ</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/student' || item.to === '/teacher'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/60 font-semibold" 
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs font-medium text-slate-500 capitalize">{user?.role === 'teacher' ? 'คุณครูผู้สอน' : 'นักเรียน'}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
