import React from 'react';
import DonutChart from '@/components/DonutChart';

const DonutChartTest = () => {
  const testData = [
    { name: 'Retail', value: 45, color: '#ef4444', profit: 135000 },
    { name: 'REVA', value: 30, color: '#f87171', profit: 90000 },
    { name: 'Wholesale', value: 25, color: '#dc2626', profit: 75000 },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>DonutChart Component Test</h1>
      
      <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '10px' }}>Test Data:</h2>
        <pre style={{ fontSize: '12px', color: '#aaa' }}>
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '10px' }}>DonutChart Component (300x300):</h2>
        <div style={{ width: '300px', height: '300px', backgroundColor: '#222', padding: '10px' }}>
          <DonutChart 
            data={testData}
            innerValue="£300k"
            innerLabel="Total Profit"
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '10px' }}>What you should see:</h2>
        <p>A donut chart with 3 colored segments (red shades) and £300k in the center</p>
        <p style={{ marginTop: '10px', color: '#ff6666' }}>
          If you don't see the chart above, there's an issue with the Recharts library or the DonutChart component.
        </p>
      </div>
    </div>
  );
};

export default DonutChartTest;