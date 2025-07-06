import React from 'react';

const ChartTest = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-4">Chart Test Page</h1>
      
      {/* Test 1: Basic colored divs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Test 1: Basic Colored Divs</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-[200px] bg-red-500 rounded p-4">
            <p className="text-white">Red Box - If you see this, basic rendering works</p>
          </div>
          <div className="h-[200px] bg-blue-500 rounded p-4">
            <p className="text-white">Blue Box - Basic CSS is working</p>
          </div>
        </div>
      </div>

      {/* Test 2: Simple bar chart with divs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Test 2: Simple Bar Chart with Divs</h2>
        <div className="bg-gray-800 p-4 rounded">
          <div className="flex items-end space-x-2 h-[200px]">
            <div className="w-8 bg-red-500" style={{ height: '80%' }}></div>
            <div className="w-8 bg-red-400" style={{ height: '60%' }}></div>
            <div className="w-8 bg-red-300" style={{ height: '40%' }}></div>
            <div className="w-8 bg-red-200" style={{ height: '20%' }}></div>
          </div>
          <p className="text-gray-400 mt-2">Simple bars using divs</p>
        </div>
      </div>

      {/* Test 3: Try to render a simple component */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Test 3: Component Test</h2>
        <SimpleChart />
      </div>

      {/* Test 4: SVG Circle */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Test 4: SVG Test</h2>
        <svg width="200" height="200" className="bg-gray-800 rounded">
          <circle cx="100" cy="100" r="80" fill="red" />
          <text x="100" y="100" textAnchor="middle" fill="white" dy=".3em">SVG Works</text>
        </svg>
      </div>
    </div>
  );
};

// Simple component to test component rendering
const SimpleChart = () => {
  return (
    <div className="bg-gray-800 p-4 rounded">
      <h3 className="text-white mb-2">Simple Component</h3>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-8 h-8 bg-green-500 rounded">{i}</div>
        ))}
      </div>
    </div>
  );
};

export default ChartTest;