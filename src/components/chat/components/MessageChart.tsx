
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MessageChartProps {
  chartData: any;
}

const MessageChart: React.FC<MessageChartProps> = ({ chartData }) => {
  if (!chartData) return null;
  
  return (
    <div className="mt-4 mb-2 bg-gray-800 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#f43f5e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MessageChart;
