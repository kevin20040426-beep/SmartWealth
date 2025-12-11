import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, CreditCard, PieChart, TrendingUp, LogOut, Loader2 } from 'lucide-react';
import { AppData, ViewState, User, BankAccount, Transaction, StockPosition } from './types';
import { Dashboard } from './components/Dashboard';
import { AccountManager } from './components/AccountManager';
import { TransactionManager } from './components/TransactionManager';
import { StockManager } from './components/StockManager';
import { ReportView } from './components/ReportView';

// Firebase Services
import { auth, db, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch
} from 'firebase/firestore';

// Initial Mock Data (For seeding)
const SEED_DATA: AppData = {
  accounts: [
    { id: '1', name: '中國信託 - 薪轉', type: 'Checking', balance: 150000, currency: 'TWD' },
    { id: '2', name: '玉山銀行 - 儲蓄', type: 'Savings', balance: 500000, currency: 'TWD' },
    { id: '3', name: '錢包現金', type: 'Cash', balance: 3500, currency: 'TWD' },
  ],
  transactions: [
    { id: '1', accountId: '1', date: '2023-10-01', amount: 50000, type: 'income', category: '薪資', description: '十月薪水' },
    { id: '2', accountId: '3', date: '2023-10-02', amount: 120, type: 'expense', category: '飲食', description: '午餐' },
    { id: '3', accountId: '1', date: '2023-10-05', amount: 15000, type: 'expense', category: '居住', description: '房租' },
    { id: '4', accountId: '1', date: '2023-10-10', amount: 3000, type: 'expense', category: '交通', description: '高鐵票' },
  ],
  stocks: [
    { id: '1', symbol: '2330.TW', name: '台積電', shares: 1000, averageCost: 550, currentPrice: 580, currency: 'TWD' },
    { id: '2', symbol: '0050.TW', name: '元大台灣50', shares: 2000, averageCost: 120, currentPrice: 135, currency: 'TWD' },
  ]
};

export default function App() {
  const [user, setUser] = useState<User>({ username: '', isLoggedIn: false });
  const [uid, setUid] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [loading, setLoading] = useState(true);
  
  // App Data State
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<StockPosition[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ username: currentUser.displayName || 'User', isLoggedIn: true });
        setUid(currentUser.uid);
      } else {
        setUser({ username: '', isLoggedIn: false });
        setUid(null);
        setAccounts([]);
        setTransactions([]);
        setStocks([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners (Real-time updates)
  useEffect(() => {
    if (!uid) return;

    // Listen to Accounts
    const qAccounts = query(collection(db, `users/${uid}/accounts`));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data);
      // Seed data if empty
      if (data.length === 0 && !localStorage.getItem(`seeded_${uid}`)) {
        seedData(uid);
      }
    });

    // Listen to Transactions
    const qTransactions = query(collection(db, `users/${uid}/transactions`));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    });

    // Listen to Stocks
    const qStocks = query(collection(db, `users/${uid}/stocks`));
    const unsubStocks = onSnapshot(qStocks, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockPosition));
      setStocks(data);
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubStocks();
    };
  }, [uid]);

  const seedData = async (userId: string) => {
    const batch = writeBatch(db);
    
    SEED_DATA.accounts.forEach(acc => {
      const docRef = doc(collection(db, `users/${userId}/accounts`));
      batch.set(docRef, { ...acc, id: docRef.id }); // Use auto-id, but we put it in field for simplicity
    });

    SEED_DATA.transactions.forEach(tx => {
      const docRef = doc(collection(db, `users/${userId}/transactions`));
      batch.set(docRef, { ...tx, id: docRef.id });
    });

    SEED_DATA.stocks.forEach(stk => {
      const docRef = doc(collection(db, `users/${userId}/stocks`));
      batch.set(docRef, { ...stk, id: docRef.id });
    });

    await batch.commit();
    localStorage.setItem(`seeded_${userId}`, 'true');
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("登入失敗，請檢查網路連線或稍後再試。");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setView(ViewState.DASHBOARD);
  };

  // --- CRUD Wrappers for Components ---

  const handleUpdateAccounts = async (newAccounts: BankAccount[]) => {
    // Only handling Adds and Deletes roughly based on diff length for this simple demo
    // In a real app, components should call addAccount / deleteAccount directly
    if (!uid) return;
    
    // Find the difference (Simplified logic: assumes last item is new or item removed)
    if (newAccounts.length > accounts.length) {
      // Add
      const newItem = newAccounts[newAccounts.length - 1];
      const { id, ...data } = newItem; 
      await addDoc(collection(db, `users/${uid}/accounts`), data);
    } else if (newAccounts.length < accounts.length) {
      // Delete
      const deletedId = accounts.find(acc => !newAccounts.find(n => n.id === acc.id))?.id;
      if (deletedId) await deleteDoc(doc(db, `users/${uid}/accounts`, deletedId));
    }
  };

  const handleUpdateTransactions = async (newTransactions: Transaction[]) => {
    if (!uid) return;
     if (newTransactions.length > transactions.length) {
      // Add (TransactionManager puts new at top, so check index 0)
      // Actually, TransactionManager logic: [new, ...old]
      // We need to be careful. Let's find the one without a Firestore-like ID or just trust the flow
      // Better: Modify Component to call a specific function.
      // But to keep component code minimal changes:
      const newItem = newTransactions[0]; // Assuming prepended
      const { id, ...data } = newItem;
      await addDoc(collection(db, `users/${uid}/transactions`), data);
    } 
    // Delete not implemented in TransactionManager UI yet, but logic would be similar
  };

  const handleUpdateStocks = async (newStocks: StockPosition[]) => {
    if (!uid) return;
    
    // Check for updates (price update) vs Add/Delete
    if (newStocks.length === stocks.length) {
      // Likely a price update
      newStocks.forEach(async (s) => {
        const original = stocks.find(o => o.id === s.id);
        if (original && original.currentPrice !== s.currentPrice) {
          await setDoc(doc(db, `users/${uid}/stocks`, s.id), s);
        }
      });
    } else if (newStocks.length > stocks.length) {
      // Add
      const newItem = newStocks[newStocks.length - 1];
      const { id, ...data } = newItem;
      await addDoc(collection(db, `users/${uid}/stocks`), data);
    } else {
      // Delete
      const deletedId = stocks.find(s => !newStocks.find(n => n.id === s.id))?.id;
      if (deletedId) await deleteDoc(doc(db, `users/${uid}/stocks`, deletedId));
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  // Login Screen
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <Wallet size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SmartWealth</h1>
            <p className="text-gray-500 mt-2">您的個人化 AI 理財管家</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              使用 Google 帳號登入
            </button>
            <p className="text-xs text-center text-gray-400 mt-4">
              *資料將安全儲存於雲端資料庫 (Firebase)。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main App Layout
  const NavItem = ({ v, icon: Icon, label }: { v: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setView(v)}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
        view === v 
          ? 'bg-indigo-50 text-indigo-600 font-semibold' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full fixed left-0 top-0 z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-indigo-700 font-bold text-xl">
            <Wallet />
            SmartWealth
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem v={ViewState.DASHBOARD} icon={LayoutDashboard} label="總覽" />
          <NavItem v={ViewState.ACCOUNTS} icon={CreditCard} label="帳戶管理" />
          <NavItem v={ViewState.TRANSACTIONS} icon={TrendingUp} label="收支紀錄" />
          <NavItem v={ViewState.STOCKS} icon={PieChart} label="股市資產" />
          <NavItem v={ViewState.REPORTS} icon={PieChart} label="分析報表" />
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="text-sm font-medium text-gray-700 truncate">{user.username}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            <span>登出</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 h-full overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2 font-bold text-indigo-700">
            <Wallet /> SmartWealth
          </div>
          <div className="flex gap-2">
             <button onClick={handleLogout} className="text-gray-500"><LogOut size={20}/></button>
          </div>
        </div>
        
        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-30">
          <button onClick={() => setView(ViewState.DASHBOARD)} className={`p-2 rounded ${view === ViewState.DASHBOARD ? 'text-indigo-600' : 'text-gray-400'}`}><LayoutDashboard size={24}/></button>
          <button onClick={() => setView(ViewState.TRANSACTIONS)} className={`p-2 rounded ${view === ViewState.TRANSACTIONS ? 'text-indigo-600' : 'text-gray-400'}`}><TrendingUp size={24}/></button>
          <button onClick={() => setView(ViewState.STOCKS)} className={`p-2 rounded ${view === ViewState.STOCKS ? 'text-indigo-600' : 'text-gray-400'}`}><PieChart size={24}/></button>
          <button onClick={() => setView(ViewState.ACCOUNTS)} className={`p-2 rounded ${view === ViewState.ACCOUNTS ? 'text-indigo-600' : 'text-gray-400'}`}><CreditCard size={24}/></button>
        </div>

        <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
          {view === ViewState.DASHBOARD && <Dashboard data={{ accounts, transactions, stocks }} />}
          {view === ViewState.ACCOUNTS && <AccountManager accounts={accounts} setAccounts={handleUpdateAccounts} />}
          {view === ViewState.TRANSACTIONS && <TransactionManager transactions={transactions} accounts={accounts} setTransactions={handleUpdateTransactions} setAccounts={handleUpdateAccounts} />}
          {view === ViewState.STOCKS && <StockManager stocks={stocks} setStocks={handleUpdateStocks} />}
          {view === ViewState.REPORTS && <ReportView transactions={transactions} />}
        </div>
      </main>
    </div>
  );
}