import React, { useState } from 'react';
import { StockPosition } from '../types';
import { Plus, RefreshCw, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { simulateStockMarketUpdate } from '../services/geminiService';

interface StockManagerProps {
  stocks: StockPosition[];
  setStocks: (s: StockPosition[]) => void;
}

export const StockManager: React.FC<StockManagerProps> = ({ stocks, setStocks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStock, setNewStock] = useState<Omit<StockPosition, 'id' | 'currentPrice'>>({
    symbol: '',
    name: '',
    shares: 0,
    averageCost: 0,
    currency: 'TWD'
  });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    setStocks([...stocks, { 
      ...newStock, 
      id, 
      currentPrice: newStock.averageCost // Init current price same as cost
    }]);
    setIsModalOpen(false);
    setNewStock({ symbol: '', name: '', shares: 0, averageCost: 0, currency: 'TWD' });
  };

  const handleUpdatePrices = async () => {
    setIsUpdating(true);
    const updatedStocks = await simulateStockMarketUpdate(stocks);
    setStocks(updatedStocks);
    setIsUpdating(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('確定要刪除此持股紀錄嗎？')) {
      setStocks(stocks.filter(s => s.id !== id));
    }
  };

  const totalMarketValue = stocks.reduce((sum, s) => sum + (s.shares * s.currentPrice), 0);
  const totalCost = stocks.reduce((sum, s) => sum + (s.shares * s.averageCost), 0);
  const totalPL = totalMarketValue - totalCost;
  const totalPLPercent = totalCost === 0 ? 0 : (totalPL / totalCost) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">股市資產管理</h2>
          <p className="text-sm text-gray-500">即時更新由 AI 模擬或估算</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleUpdatePrices}
            disabled={isUpdating || stocks.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={isUpdating ? 'animate-spin' : ''} /> 
            {isUpdating ? '更新中...' : '更新行情'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={18} /> 新增持股
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-indigo-200 text-sm mb-1">證券總市值</p>
            <p className="text-3xl font-bold font-mono">${totalMarketValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-sm mb-1">總投入成本</p>
            <p className="text-2xl font-medium font-mono">${totalCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-indigo-200 text-sm mb-1">未實現損益</p>
            <div className={`flex items-center gap-2 text-2xl font-bold ${totalPL >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalPL >= 0 ? <TrendingUp size={24}/> : <TrendingDown size={24}/>}
              <span>${Math.abs(totalPL).toLocaleString()} ({totalPLPercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">代碼 / 名稱</th>
                <th className="p-4 font-medium text-gray-500 text-right">股數</th>
                <th className="p-4 font-medium text-gray-500 text-right">平均成本</th>
                <th className="p-4 font-medium text-gray-500 text-right">現價 (估)</th>
                <th className="p-4 font-medium text-gray-500 text-right">市值</th>
                <th className="p-4 font-medium text-gray-500 text-right">損益</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">目前沒有持股</td>
                </tr>
              ) : (
                stocks.map(s => {
                  const marketValue = s.shares * s.currentPrice;
                  const gainLoss = marketValue - (s.shares * s.averageCost);
                  const gainLossPercent = ((s.currentPrice - s.averageCost) / s.averageCost) * 100;
                  const isProfit = gainLoss >= 0;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{s.symbol}</div>
                        <div className="text-sm text-gray-500">{s.name}</div>
                      </td>
                      <td className="p-4 text-right font-mono">{s.shares.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono">${s.averageCost.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono text-gray-800">${s.currentPrice.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-medium">${marketValue.toLocaleString()}</td>
                      <td className={`p-4 text-right font-mono ${isProfit ? 'text-red-600' : 'text-green-600'}`}>
                        {isProfit ? '+' : '-'}${Math.abs(gainLoss).toLocaleString()}
                        <br/>
                        <span className="text-xs">({isProfit ? '+' : ''}{gainLossPercent.toFixed(2)}%)</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">新增持股</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">股票代碼</label>
                  <input 
                    type="text" 
                    required
                    placeholder="例如: 2330.TW"
                    className="w-full border rounded-lg p-2 uppercase"
                    value={newStock.symbol}
                    onChange={e => setNewStock({...newStock, symbol: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">股票名稱</label>
                  <input 
                    type="text" 
                    required
                    placeholder="台積電"
                    className="w-full border rounded-lg p-2"
                    value={newStock.name}
                    onChange={e => setNewStock({...newStock, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">持有股數</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border rounded-lg p-2"
                    value={newStock.shares}
                    onChange={e => setNewStock({...newStock, shares: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">平均成本</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border rounded-lg p-2"
                    value={newStock.averageCost}
                    onChange={e => setNewStock({...newStock, averageCost: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">幣別</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={newStock.currency}
                  onChange={e => setNewStock({...newStock, currency: e.target.value})}
                >
                  <option value="TWD">TWD (新台幣)</option>
                  <option value="USD">USD (美金)</option>
                </select>
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