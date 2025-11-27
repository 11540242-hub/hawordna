// 股票數據介面
export interface StockCandle {
  t: number; // Time
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Close
  v: number; // Volume
}

export interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High day
  l: number; // Low day
  o: number; // Open day
  pc: number; // Previous close
}

// 資產與交易介面
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  type: 'Stock' | 'Cash' | 'Crypto' | 'Other';
}

export interface TradeRecord {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  total: number;
}

// 應用程式狀態介面
export interface AppState {
  isMockMode: boolean;
  apiKeyStatus: {
    finnhub: boolean;
    gemini: boolean;
    firebase: boolean;
  };
}

export enum TimeRange {
  Day = '1D',
  Month = '1M',
  Year = '1Y'
}