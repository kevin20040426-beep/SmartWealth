import React, { useState } from 'react';
import { AppData, StockPosition, Transaction } from '../types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, BrainCircuit } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';

interface DashboardProps {
  data: AppData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const stockValue = data.stocks.reduce((sum, stock) => sum + (stock.shares * stock.currentPrice), 0);
  const stockCost = data.stocks.reduce((sum, stock) => sum + (stock.shares * stock.averageCost), 0);
  const stockReturn = stockValue - stockCost;

  // Calculate this month's income/expense
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getFinancialAdvice(data.transactions, data.stocks);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">總覽儀表板</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">總資產 (現金+股票)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                ${(totalBalance + stockValue).toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">本月收入</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">
                +${income.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">本月支出</p>
              <h3 className="text-2xl font-bold text-red-600 mt-2">
                -${expense.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">證券未實現損益</p>
              <h3 className={`text-2xl font-bold mt-2 ${stockReturn >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stockReturn >= 0 ? '+' : ''}{stockReturn.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 mt-1">台股紅漲綠跌</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Advice Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="h-8 w-8 text-yellow-300" />
          <h3 className="text-xl font-bold">Gemini 智能財務顧問</h3>
        </div>
        
        {!advice ? (
          <div className="space-y-4">
            <p className="opacity-90">點擊下方按鈕，讓 AI 分析您的資產配置與消費習慣，提供專屬理財建議。</p>
            <button 
              onClick={handleGetAdvice}
              disabled={loadingAdvice}
              className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-100 transition disabled:opacity-70"
            >
              {loadingAdvice ? '分析中...' : '生成財務建議'}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20 mb-4">
              <p className="leading-relaxed whitespace-pre-line">{advice}</p>
            </div>
            <button 
              onClick={handleGetAdvice}
              className="text-sm text-indigo-100 hover:text-white underline"
            >
              重新分析
            </button>
          </div>
        )}
      </div>
    </div>
  );
};