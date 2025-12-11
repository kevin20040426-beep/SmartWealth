export interface User {
  username: string;
  isLoggedIn: boolean;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit' | 'Cash' | 'Investment';
  balance: number;
  currency: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
}

export interface StockPosition {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  averageCost: number;
  currentPrice: number; // Mocked or AI updated
  currency: string;
}

export interface AppData {
  accounts: BankAccount[];
  transactions: Transaction[];
  stocks: StockPosition[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ACCOUNTS = 'ACCOUNTS',
  TRANSACTIONS = 'TRANSACTIONS',
  STOCKS = 'STOCKS',
  REPORTS = 'REPORTS',
}

export const CATEGORIES = {
  income: ['薪資', '獎金', '投資收益', '兼職', '其他'],
  expense: ['飲食', '交通', '居住', '娛樂', '購物', '醫療', '教育', '保險', '稅務', '其他'],
};