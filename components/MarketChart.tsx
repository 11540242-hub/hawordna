import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { StockCandle } from '../types';

interface MarketChartProps {
  data: StockCandle[];
  symbol: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = new Date(data.t).toLocaleDateString();
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-slate-700 mb-1">{dateStr}</p>
        <p className="text-slate-600">開盤: <span className="font-mono">{data.o}</span></p>
        <p className="text-slate-600">最高: <span className="font-mono">{data.h}</span></p>
        <p className="text-slate-600">最低: <span className="font-mono">{data.l}</span></p>
        <p className="text-slate-600">收盤: <span className="font-mono">{data.c}</span></p>
        <p className="text-slate-500 mt-1 text-xs">量: {data.v.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// 為了在 Recharts 中模擬 K 線，我們使用 Bar Chart 的變體
// 使用 ErrorBar 或自定義 Shape 比較複雜，這裡為了穩定性，
// 我們使用 ComposedChart:
// 1. Bar 用於繪製 (開盤-收盤) 的實體
// 2. Line (隱藏線) + ErrorBar 用於影線? 不，使用 ReferenceLine 或是簡單的 High/Low 區間顯示較難。
// 簡化方案：專業的 K 線通常需要特殊的圖表庫 (如 lightweight-charts)。
// 在 Recharts 中，我們可以用一條 Line 代表收盤走勢，Bar 代表成交量，
// 或者用自定義 Shape 畫 K 線。這裡我們採用「收盤價走勢線 + 成交量」的簡潔呈現，
// 加上自定義的高低點 Shape 會更好，但為求代碼精簡不崩潰，我們畫兩層：
// 主圖：收盤價曲線 (Area)
// 副圖：成交量 (Bar)

const MarketChart: React.FC<MarketChartProps> = ({ data, symbol }) => {
  const isUp = (d: StockCandle) => d.c >= d.o;

  return (
    <div className="w-full h-[400px] bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700">{symbol} - 價格與成交量走勢</h3>
        <div className="flex gap-2 text-xs">
            <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>價格</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-slate-300 rounded-full mr-1"></span>量</div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="t" 
            tickFormatter={(ts) => new Date(ts).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
            tick={{ fontSize: 11, fill: '#64748b' }}
            minTickGap={30}
          />
          <YAxis 
            yAxisId="price" 
            domain={['auto', 'auto']} 
            orientation="right" 
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(val) => val.toFixed(1)}
          />
          <YAxis 
            yAxisId="volume" 
            orientation="left" 
            tick={{ fontSize: 11, fill: '#cbd5e1' }}
            axisLine={false}
            tickLine={false}
            showGrid={false}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Volume Bars */}
          <Bar dataKey="v" yAxisId="volume" barSize={20} fill="#cbd5e1" opacity={0.5}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.c >= entry.o ? '#fee2e2' : '#dcfce7'} />
            ))}
          </Bar>

          {/* Price Line */}
          <Line 
            yAxisId="price"
            type="monotone" 
            dataKey="c" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketChart;