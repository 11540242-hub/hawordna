import React, { useState, useEffect, useCallback } from 'react';
import { api, hasRealConfig } from './services/api';
import { Asset, StockCandle, StockQuote, TradeRecord, TimeRange } from './types';
import { MOCK_ASSETS, MOCK_TRADES, EDUCATIONAL_CONTENT } from './constants';
import MarketChart from './components/MarketChart';
import Dashboard from './components/Dashboard';
import { LineChart, PieChart, BookOpen, Activity, Cpu, Settings, Search, PlusCircle, History } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [isMock, setIsMock] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'market' | 'assets' | 'trade'>('market');
  
  // Market Data
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [searchInput, setSearchInput] = useState<string>('AAPL');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<StockCandle[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.Day);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Assets & User Data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  
  // Analysis
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Trade Form
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);

  // --- Effects ---

  // Initialization
  useEffect(() => {
    // Check if we can run in real mode
    const canRunReal = hasRealConfig.finnhub || hasRealConfig.firebase;
    setIsMock(!canRunReal);
    api.setMockMode(!canRunReal);

    // Load initial data
    setAssets(MOCK_ASSETS);
    setTrades(MOCK_TRADES);
    fetchMarketData('AAPL');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mode Toggle
  const toggleMode = () => {
    const newMode = !isMock;
    setIsMock(newMode);
    api.setMockMode(newMode);
    
    // Refresh data on mode switch
    fetchMarketData(symbol);
    setAnalysis(''); // clear analysis as it might be different
  };

  // Fetch Market Data
  const fetchMarketData = useCallback(async (sym: string) => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        api.getQuote(sym),
        api.getCandles(sym, timeRange)
      ]);
      setQuote(q);
      setCandles(c);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]); // Re-fetch when timeRange changes

  useEffect(() => {
    if (symbol) {
      fetchMarketData(symbol);
    }
  }, [symbol, timeRange, fetchMarketData]);

  // Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const upperSym = searchInput.toUpperCase();
    setSymbol(upperSym);
  };

  // Handle Analysis
  const handleAnalyze = async () => {
    if (!quote) return;
    setAnalyzing(true);
    const result = await api.getAnalysis(symbol, quote);
    setAnalysis(result);
    setAnalyzing(false);
  };

  // Handle Trade
  const handleTrade = async () => {
    if (!quote) return;
    
    const total = quote.c * tradeQuantity;
    const newTrade: TradeRecord = {
      id: Date.now().toString(),
      symbol,
      type: tradeAction,
      price: quote.c,
      quantity: tradeQuantity,
      timestamp: Date.now(),
      total
    };

    // Save to "Backend"
    await api.saveTrade(newTrade);

    // Update Local State (Optimistic UI)
    setTrades([newTrade, ...trades]);
    
    // Simple Asset Update Logic
    const existingAsset = assets.find(a => a.symbol === symbol);
    if (tradeAction === 'BUY') {
      if (existingAsset) {
        // Weighted Average Cost calculation
        const newTotalQty = existingAsset.quantity + tradeQuantity;
        const newAvgCost = ((existingAsset.quantity * existingAsset.avgCost) + total) / newTotalQty;
        setAssets(assets.map(a => a.symbol === symbol ? { ...a, quantity: newTotalQty, avgCost: newAvgCost } : a));
      } else {
        setAssets([...assets, { 
          id: Date.now().toString(), 
          symbol, 
          name: symbol, 
          quantity: tradeQuantity, 
          avgCost: quote.c, 
          type: 'Stock' 
        }]);
      }
      // Deduct Cash (Simulated)
      setAssets(prev => prev.map(a => a.symbol === 'USD' ? { ...a, quantity: a.quantity - total } : a));
    } else {
       // Sell logic (omitted complex validation for brevity)
       if (existingAsset && existingAsset.quantity >= tradeQuantity) {
         setAssets(prev => prev.map(a => a.symbol === symbol ? { ...a, quantity: a.quantity - tradeQuantity } : a).filter(a => a.quantity > 0));
         setAssets(prev => prev.map(a => a.symbol === 'USD' ? { ...a, quantity: a.quantity + total } : a));
       } else {
         alert("持倉不足！");
         return;
       }
    }
    
    alert(`交易成功: ${tradeAction} ${tradeQuantity} ${symbol}`);
  };

  // --- Render Helpers ---

  const renderPercentage = (val: number) => {
    const isPos = val >= 0;
    return (
      <span className={`font-medium ${isPos ? 'text-up' : 'text-down'}`}>
        {isPos ? '▲' : '▼'} {Math.abs(val)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">AlphaTrade <span className="text-blue-600">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isMock ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isMock ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              {isMock ? '模擬模式 (Mock Mode)' : '真實模式 (Real Mode)'}
            </div>
            <button onClick={toggleMode} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="切換模式">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Global Dashboard Stats */}
        <Dashboard assets={assets} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Market & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="輸入代號 (例如 AAPL)"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </form>
              <div className="flex gap-2">
                {[TimeRange.Day, TimeRange.Month, TimeRange.Year].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${timeRange === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Info */}
            {quote && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{symbol}</h2>
                  <p className="text-sm text-slate-500">NasdaqGS - 延遲報價</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-slate-900">{quote.c.toFixed(2)}</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className={`text-lg font-medium ${quote.d >= 0 ? 'text-up' : 'text-down'}`}>
                      {quote.d > 0 ? '+' : ''}{quote.d.toFixed(2)}
                    </span>
                    {renderPercentage(quote.dp)}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            {loading ? (
              <div className="h-[400px] w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">載入數據中...</div>
            ) : (
              <MarketChart data={candles} symbol={symbol} />
            )}

            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">Gemini 智能投資顧問</h3>
                </div>
                <button 
                  onClick={handleAnalyze} 
                  disabled={analyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {analyzing ? '分析中...' : '生成分析報告'}
                </button>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg min-h-[100px] text-sm leading-relaxed text-indigo-900 shadow-sm whitespace-pre-line">
                {analysis ? analysis : "點擊按鈕讓 AI 根據當前行情為您提供專業的趨勢分析與投資建議。"}
              </div>
            </div>

             {/* Education Section */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="text-slate-400" size={20} />
                  <h3 className="font-bold text-slate-700">新手投資教室</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {EDUCATIONAL_CONTENT.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors group cursor-help relative">
                      <h4 className="font-bold text-slate-800 mb-2">{item.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 group-hover:line-clamp-none">{item.content}</p>
                    </div>
                  ))}
                </div>
            </div>

          </div>

          {/* Right Column: Trading & Assets */}
          <div className="space-y-6">
            
            {/* Trading Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-24">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-blue-500"/> 模擬交易下單
              </h3>
              
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setTradeAction('BUY')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${tradeAction === 'BUY' ? 'bg-up text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  買入
                </button>
                <button 
                  onClick={() => setTradeAction('SELL')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${tradeAction === 'SELL' ? 'bg-down text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  賣出
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">標的</label>
                  <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-mono font-bold text-slate-700">{symbol}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">現價 (USD)</label>
                  <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-mono text-slate-700">{quote ? quote.c : '---'}</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">股數</label>
                  <input 
                    type="number" 
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm text-slate-500">預估總額</span>
                  <span className="text-xl font-bold text-slate-800">${quote ? (quote.c * tradeQuantity).toFixed(2) : '0.00'}</span>
                </div>

                <button 
                  onClick={handleTrade}
                  disabled={!quote}
                  className={`w-full py-3 rounded-lg text-white font-bold shadow-md transform active:scale-95 transition-all ${tradeAction === 'BUY' ? 'bg-up hover:bg-red-600' : 'bg-down hover:bg-green-600'}`}
                >
                  確認下單
                </button>
              </div>
            </div>

            {/* Asset List (Mini) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">持倉資產</h3>
                 <button className="text-blue-500 text-xs hover:underline">管理</button>
               </div>
               <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                 {assets.map(asset => (
                   <div key={asset.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                     <div>
                       <div className="font-bold text-slate-800">{asset.symbol}</div>
                       <div className="text-xs text-slate-500">{asset.quantity} 股</div>
                     </div>
                     <div className="text-right">
                       <div className="font-medium text-slate-700">${(asset.quantity * (quote && asset.symbol === symbol ? quote.c : asset.avgCost)).toLocaleString()}</div>
                       {asset.type !== 'Cash' && (
                          <div className="text-xs text-slate-400">均價 ${asset.avgCost.toFixed(1)}</div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* History (Mini) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                  <History size={16} className="text-slate-400"/>
                  <h3 className="font-bold text-slate-800">交易紀錄</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">時間</th>
                        <th className="px-4 py-2 font-medium">標的</th>
                        <th className="px-4 py-2 font-medium">價格</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trades.slice(0, 10).map(trade => (
                        <tr key={trade.id}>
                          <td className="px-4 py-2 text-slate-500">{new Date(trade.timestamp).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.type === 'BUY' ? 'bg-red-50 text-up' : 'bg-green-50 text-down'}`}>
                              {trade.type === 'BUY' ? '買' : '賣'} {trade.symbol}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-700">${trade.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;