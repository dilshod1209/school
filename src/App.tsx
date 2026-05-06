import { useState, useEffect, createContext, useContext } from 'react';
import { auth, loginWithGoogle, logout, onAuthStateChanged, type User } from './lib/firebase';
import { 
  Users, 
  UserSquare2, 
  LayoutDashboard, 
  BookOpen, 
  CreditCard, 
  CheckSquare,
  LogOut,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Views
import Dashboard from './components/views/Dashboard';
import Students from './components/views/Students';
import Teachers from './components/views/Teachers';
import Groups from './components/views/Groups';
import Payments from './components/views/Payments';
import Attendance from './components/views/Attendance';

type View = 'dashboard' | 'students' | 'teachers' | 'groups' | 'payments' | 'attendance';

export const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FDFCFB]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <GraduationCap className="w-12 h-12 text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FDFCFB] p-4 text-center">
        <GraduationCap className="w-16 h-16 text-indigo-600 mb-6" />
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 font-sans">Edu-Manage</h1>
        <p className="text-gray-500 mb-8 max-w-sm">O'quv markazini boshqarishning eng oson va zamonaviy usuli.</p>
        <button 
          onClick={loginWithGoogle}
          className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all font-medium text-gray-700 cursor-pointer"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Google orqali kirish
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
    { id: 'students', label: 'Talabalar', icon: Users },
    { id: 'teachers', label: 'O\'qituvchilar', icon: UserSquare2 },
    { id: 'groups', label: 'Guruhlar', icon: BookOpen },
    { id: 'payments', label: 'To\'lovlar', icon: CreditCard },
    { id: 'attendance', label: 'Davomat', icon: CheckSquare },
  ];

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <div className="flex h-screen bg-[#F8F9FA] text-slate-900 font-sans">
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-lg cursor-pointer"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>

        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed lg:relative z-40 h-full bg-white border-r border-gray-100 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
            isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                <GraduationCap size={24} />
              </div>
              {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Edu-Manage</span>}
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer",
                    activeView === item.id 
                      ? "bg-indigo-50 text-indigo-700 font-semibold" 
                      : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} className={cn(activeView === item.id ? "text-indigo-600" : "group-hover:text-slate-900")} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
               <div className={cn("flex items-center gap-3 mb-4", !isSidebarOpen && "justify-center")}>
                 <img src={user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName} className="w-8 h-8 rounded-full border border-gray-100" />
                 {isSidebarOpen && (
                   <div className="overflow-hidden">
                     <p className="text-sm font-semibold truncate">{user.displayName}</p>
                     <p className="text-xs text-gray-500 truncate">{user.email}</p>
                   </div>
                 )}
               </div>
               <button 
                onClick={logout}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer",
                  !isSidebarOpen && "justify-center"
                )}
               >
                 <LogOut size={18} />
                 {isSidebarOpen && <span className="text-sm font-medium">Chiqish</span>}
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#F8F9FA] p-4 lg:p-8">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                {menuItems.find(m => m.id === activeView)?.label}
              </h1>
              <p className="text-slate-500 mt-1">Hush kelibsiz, {user.displayName?.split(' ')[0]}</p>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && <Dashboard />}
              {activeView === 'students' && <Students />}
              {activeView === 'teachers' && <Teachers />}
              {activeView === 'groups' && <Groups />}
              {activeView === 'payments' && <Payments />}
              {activeView === 'attendance' && <Attendance />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
