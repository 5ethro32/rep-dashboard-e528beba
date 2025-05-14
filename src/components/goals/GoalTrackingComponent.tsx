
import React, { useMemo } from 'react';
import { Goal } from '@/types/goals.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/formatting-utils';

interface GoalTrackingComponentProps {
  goals: Goal[];
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const GoalTrackingComponent = ({ goals }: GoalTrackingComponentProps) => {
  const activeGoals = goals.filter(goal => goal.active);
  
  const { 
    totalCompleted, 
    totalRemaining,
    totalFinancialImpact,
    targetFinancialImpact,
    remainingFinancialImpact,
    percentComplete
  } = useMemo(() => {
    let completed = 0;
    let remaining = 0;
    let financialImpact = 0;
    let targetImpact = 0;
    
    activeGoals.forEach(goal => {
      completed += Math.min(goal.current_quantity, goal.target_quantity);
      remaining += Math.max(0, goal.target_quantity - goal.current_quantity);
      financialImpact += goal.current_quantity * goal.price;
      targetImpact += goal.target_quantity * goal.price;
    });
    
    const remainingImpact = targetImpact - financialImpact;
    const percent = targetImpact > 0 
      ? Math.round((financialImpact / targetImpact) * 100) 
      : 0;
    
    return {
      totalCompleted: completed,
      totalRemaining: remaining,
      totalFinancialImpact: financialImpact,
      targetFinancialImpact: targetImpact,
      remainingFinancialImpact: remainingImpact,
      percentComplete: percent
    };
  }, [activeGoals]);

  const chartData: ChartData[] = [
    {
      name: 'Completed',
      value: totalFinancialImpact,
      color: '#22c55e' // green-500
    },
    {
      name: 'Remaining',
      value: remainingFinancialImpact,
      color: '#3b82f6' // blue-500
    }
  ];

  const productData = useMemo(() => {
    return activeGoals.map(goal => {
      const percentComplete = goal.target_quantity > 0 
        ? Math.round((goal.current_quantity / goal.target_quantity) * 100)
        : 0;
      const financialImpact = goal.current_quantity * goal.price;
      const remainingQuantity = Math.max(0, goal.target_quantity - goal.current_quantity);
      
      return {
        name: goal.product_name,
        currentQuantity: goal.current_quantity,
        targetQuantity: goal.target_quantity,
        remainingQuantity: remainingQuantity,
        price: goal.price,
        financialImpact: financialImpact,
        percentComplete: percentComplete
      };
    });
  }, [activeGoals]);

  if (activeGoals.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl">Goal Progress Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Impact Chart */}
          <div className="col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-center font-medium mb-2">Financial Impact</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="font-medium">{formatCurrency(totalFinancialImpact)} of {formatCurrency(targetFinancialImpact)}</p>
                  <p className="text-sm text-gray-400">{percentComplete}% Complete</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Product Summary */}
          <div className="col-span-1 lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Product Progress</h3>
                <div className="space-y-4">
                  {productData.map((product, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{product.name}</span>
                        <span>{product.currentQuantity} of {product.targetQuantity} units</span>
                      </div>
                      <div className="h-2 w-full bg-gray-700 rounded-full">
                        <div 
                          className="h-full bg-finance-red rounded-full" 
                          style={{ width: `${product.percentComplete}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{product.percentComplete}% Complete</span>
                        <span>{formatCurrency(product.price)} × {product.currentQuantity} = {formatCurrency(product.financialImpact)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalTrackingComponent;
