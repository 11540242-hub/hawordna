import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset } from '../types';

interface DashboardProps {
  assets: Asset[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ assets }) => {
  const totalValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.avgCost), 0);
  
  // Group small assets into "Other"
  const chartData = assets.map(a => ({
    name: a.symbol,
    value: a.quantity * a.avgCost
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Value Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
        <h3 className="text-slate-500 font-medium mb-2">總資產價值</h3>
        <p className="text-4xl font-bold text-slate-800">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-4 flex items-center text-sm text-green-500">
           <span className="bg-green-100 px-2 py-1 rounded">+5.2% 本月成長</span>
        </div>
      </div>

      {/* Asset Distribution */}
      <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-slate-700 font-bold mb-4">資產配置分佈</h3>
        <div className="h-[200px] flex">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value: number) => `$${value.toLocaleString()}`}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;