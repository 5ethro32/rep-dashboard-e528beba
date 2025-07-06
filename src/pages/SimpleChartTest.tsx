import React from 'react';

const SimpleChartTest = () => {
  const mockData = [
    { name: 'John', value: 80 },
    { name: 'Jane', value: 65 },
    { name: 'Bob', value: 45 },
    { name: 'Alice', value: 30 },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Simple Chart Test - Inline Styles</h1>
      
      {/* Test 1: Plain HTML */}
      <div style={{ marginBottom: '40px', backgroundColor: '#333', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>1. Plain HTML Test</h2>
        <p>If you can see this text, basic HTML rendering works.</p>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'red', marginTop: '10px' }}>
          Red Square
        </div>
      </div>

      {/* Test 2: Simple Bar Chart */}
      <div style={{ marginBottom: '40px', backgroundColor: '#333', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>2. Simple Bar Chart with Inline Styles</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px' }}>
          {mockData.map((item, index) => (
            <div key={index} style={{ 
              width: '40px', 
              height: `${item.value}%`, 
              backgroundColor: `hsl(${index * 30}, 70%, 50%)`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              {item.name[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Test 3: Simple Donut Chart (using divs) */}
      <div style={{ marginBottom: '40px', backgroundColor: '#333', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>3. Fake Donut Chart with Divs</h2>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          borderRadius: '50%', 
          background: 'conic-gradient(red 0deg 90deg, blue 90deg 180deg, green 180deg 270deg, yellow 270deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            backgroundColor: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            £100k
          </div>
        </div>
      </div>

      {/* Test 4: What you should see */}
      <div style={{ backgroundColor: '#444', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>What You Should See:</h2>
        <ol style={{ marginLeft: '20px' }}>
          <li>A red square in the first box</li>
          <li>Colored bars of different heights in the second box</li>
          <li>A circular chart-like div in the third box</li>
        </ol>
        <p style={{ marginTop: '10px', color: '#aaa' }}>
          If you see all of these, then the issue is with the chart library components, not with React rendering.
        </p>
      </div>
    </div>
  );
};

export default SimpleChartTest;