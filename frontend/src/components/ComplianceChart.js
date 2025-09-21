import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

const ComplianceChart = () => {
  // Mock data for compliance score over time
  const data = [
    { date: '2024-01-01', score: 98.2, transactions: 145 },
    { date: '2024-01-02', score: 97.8, transactions: 167 },
    { date: '2024-01-03', score: 98.5, transactions: 189 },
    { date: '2024-01-04', score: 96.9, transactions: 203 },
    { date: '2024-01-05', score: 98.1, transactions: 178 },
    { date: '2024-01-06', score: 97.6, transactions: 156 },
    { date: '2024-01-07', score: 98.8, transactions: 134 },
  ];

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Compliance Score Trend</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <span className="text-sm text-gray-300">Compliance Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-sm text-gray-300">Transactions</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="transactionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              yAxisId="score"
              orientation="left"
              domain={[95, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="transactions"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Area
              yAxisId="score"
              type="monotone"
              dataKey="score"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#scoreGradient)"
            />
            <Line
              yAxisId="transactions"
              type="monotone"
              dataKey="transactions"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#1e40af' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">98.8%</p>
          <p className="text-sm text-gray-400">Current Score</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">1,172</p>
          <p className="text-sm text-gray-400">Total Transactions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">+1.2%</p>
          <p className="text-sm text-gray-400">Weekly Change</p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChart;
