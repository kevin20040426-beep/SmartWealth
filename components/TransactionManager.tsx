import React, { useState } from 'react';
import { Transaction, BankAccount, CATEGORIES, TransactionType } from '../types';
import { Plus, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TransactionManagerProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  setTransactions: (t: Transaction[]) => void;
  setAccounts: (a: BankAccount[]) => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({ 
  transactions, 
  accounts, 
  setTransactions, 
  setAccounts 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  const [newTx, setNewTx] = useState<Omit<Transaction, 'id'>>({
    accountId: accounts[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'expense',
    category: CATEGORIES.expense[0],
    description: ''
  });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.accountId) return alert('請先建立銀行帳戶');

    const id = Date.now().toString();
    const transaction: Transaction = { ...newTx, id };
    
    // Update transactions list
    const sortedTransactions = [transaction, ...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(sortedTransactions);

    // Update account balance
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === newTx.accountId) {
        const amountChange = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        return { ...acc, balance: acc.balance + amountChange };
      }
      return acc;
    });
    setAccounts(updatedAccounts);

    setIsModalOpen(false);
    // Reset form partially
    setNewTx(prev => ({
      ...prev,
      amount: 0,
      description: ''
    }));
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">財務紀錄</h2>
        <div className="flex gap-2">
          <div className="flex bg-white border rounded-lg overflow-hidden p-1">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm rounded-md ${filterType === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'}`}
            >
              全部
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`px-3 py-1 text-sm rounded-md ${filterType === 'income' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
            >
              收入
            </button>
            <button 
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 text-sm rounded-md ${filterType === 'expense' ? 'bg-red-100 text-red-700' : 'text-gray-600'}`}
            >
              支出
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> 記一筆
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">日期</th>
                <th className="p-4 font-medium text-gray-500">帳戶</th>
                <th className="p-4 font-medium text-gray-500">類別</th>
                <th className="p-4 font-medium text-gray-500">描述</th>
                <th className="p-4 font-medium text-gray-500 text-right">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">目前沒有交易紀錄</td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-600">{t.date}</td>
                    <td className="p-4 text-gray-600">
                      {accounts.find(a => a.id === t.accountId)?.name || 'Unknown'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800">{t.description || '-'}</td>
                    <td className={`p-4 text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {t.type === 'income' ? <ArrowUpCircle size={16}/> : <ArrowDownCircle size={16}/>}
                        {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">新增交易</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                  <select 
                    className="w-full border rounded-lg p-2"
                    value={newTx.type}
                    onChange={e => {
                      const t = e.target.value as TransactionType;
                      setNewTx({
                        ...newTx, 
                        type: t,
                        category: t === 'income' ? CATEGORIES.income[0] : CATEGORIES.expense[0]
                      });
                    }}
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border rounded-lg p-2"
                    value={newTx.date}
                    onChange={e => setNewTx({...newTx, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳戶</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={newTx.accountId}
                  onChange={e => setNewTx({...newTx, accountId: e.target.value})}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (${a.balance})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">類別</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={newTx.category}
                  onChange={e => setNewTx({...newTx, category: e.target.value})}
                >
                  {(newTx.type === 'income' ? CATEGORIES.income : CATEGORIES.expense).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="w-full border rounded-lg p-2 text-lg font-mono"
                  value={newTx.amount}
                  onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述 (選填)</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  placeholder="早餐、計程車費..."
                  value={newTx.description}
                  onChange={e => setNewTx({...newTx, description: e.target.value})}
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
                  className={`px-4 py-2 text-white rounded-lg transition ${newTx.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  確認
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};