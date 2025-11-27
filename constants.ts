import { Asset, StockCandle, TradeRecord } from './types';

// 模擬的 K 線數據生成器
export const generateMockCandles = (count: number, startPrice: number): StockCandle[] => {
  const candles: StockCandle[] = [];
  let currentPrice = startPrice;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = count; i > 0; i--) {
    const time = now - i * oneDay;
    const volatility = currentPrice * 0.02;
    const open = currentPrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 50000;

    candles.push({
      t: time,
      o: parseFloat(open.toFixed(2)),
      h: parseFloat(high.toFixed(2)),
      l: parseFloat(low.toFixed(2)),
      c: parseFloat(close.toFixed(2)),
      v: volume,
    });
    currentPrice = close;
  }
  return candles;
};

// 初始模擬資產
export const MOCK_ASSETS: Asset[] = [
  { id: '1', symbol: 'USD', name: '現金', quantity: 50000, avgCost: 1, type: 'Cash' },
  { id: '2', symbol: 'AAPL', name: 'Apple Inc.', quantity: 150, avgCost: 145.20, type: 'Stock' },
  { id: '3', symbol: 'TSLA', name: 'Tesla, Inc.', quantity: 50, avgCost: 210.50, type: 'Stock' },
  { id: '4', symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 20, avgCost: 450.00, type: 'Stock' },
];

// 初始模擬交易紀錄
export const MOCK_TRADES: TradeRecord[] = [
  { id: 't1', symbol: 'AAPL', type: 'BUY', price: 140.00, quantity: 100, timestamp: Date.now() - 86400000 * 30, total: 14000 },
  { id: 't2', symbol: 'TSLA', type: 'BUY', price: 210.50, quantity: 50, timestamp: Date.now() - 86400000 * 15, total: 10525 },
  { id: 't3', symbol: 'AAPL', type: 'BUY', price: 155.60, quantity: 50, timestamp: Date.now() - 86400000 * 2, total: 7780 },
];

export const MOCK_ANALYSIS = `
[模擬 AI 分析] 
根據目前的市場數據分析：
1. 技術面：該股票目前處於上升趨勢，RSI 指標顯示動能強勁，但接近超買區。
2. 基本面：公司近期財報表現優於預期，現金流穩健。
3. 投資建議：建議投資人續抱，若回檔至支撐位可考慮加碼。長期目標價看好，但需注意大盤波動風險。
`;

export const EDUCATIONAL_CONTENT = [
  {
    title: "如何看懂 K 線圖 (Candlestick)",
    content: "K 線由「開盤價」、「收盤價」、「最高價」、「最低價」組成。紅色實體表示收盤 > 開盤 (漲)，綠色實體表示收盤 < 開盤 (跌)。上下影線代表當日價格波動的極值。"
  },
  {
    title: "成交量 (Volume) 的意義",
    content: "成交量代表市場的活躍程度。價格上漲配合成交量放大，通常代表趨勢強勁；價格上漲但量縮，可能代表買氣不足，需小心回調。"
  },
  {
    title: "簡單移動平均線 (SMA)",
    content: "SMA 是過去一段時間的平均價格連線。當股價站上 SMA 代表強勢，跌破則代表弱勢。常用的有 5日(週線)、20日(月線)、60日(季線)。"
  }
];