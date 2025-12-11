import React, { useState } from 'react';
import { BankAccount } from '../types';
import { Plus, Trash2, Edit2, CreditCard } from 'lucide-react';

interface AccountManagerProps {
  accounts: BankAccount[];
  setAccounts: (accounts: BankAccount[]) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, setAccounts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Omit<BankAccount, 'id'>>({
    name: '',
    type: 'Savings',
    balance: 0,
    currency: 'TWD'
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    setAccounts([...accounts, { ...newAccount, id }]);
    setIsModalOpen(false);
    setNewAccount({ name: '', type: 'Savings', balance: 0, currency: 'TWD' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('確定要刪除此帳戶嗎？這將不會刪除關聯的交易紀錄，但會影響總資產計算。')) {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">銀行與現金帳戶管理</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> 新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-full text-indigo-600">
                <CreditCard size={24} />
              </div>
              <button onClick={() => handleDelete(acc.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{acc.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{acc.type} • {acc.currency}</p>
            <div className="text-2xl font-bold text-gray-800">
              ${acc.balance.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">新增帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳戶名稱</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newAccount.name}
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={newAccount.type}
                  onChange={e => setNewAccount({...newAccount, type: e.target.value as any})}
                >
                  <option value="Checking">活存 (Checking)</option>
                  <option value="Savings">定存/儲蓄 (Savings)</option>
                  <option value="Credit">信用卡 (Credit)</option>
                  <option value="Cash">現金 (Cash)</option>
                  <option value="Investment">投資帳戶 (Investment)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始餘額</label>
                <input 
                  type="number" 
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newAccount.balance}
                  onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};