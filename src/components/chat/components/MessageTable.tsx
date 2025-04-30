
import React from 'react';

interface MessageTableProps {
  tableData: any[];
  tableHeaders: string[];
}

const MessageTable: React.FC<MessageTableProps> = ({ tableData, tableHeaders }) => {
  if (!tableData || !tableHeaders) return null;
  
  return (
    <div className="mt-4 mb-2 overflow-x-auto">
      <table className="min-w-full bg-gray-800 rounded-lg">
        <thead>
          <tr>
            {tableHeaders.map((header, index) => (
              <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
              {Object.values(row).map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                  {cell as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MessageTable;
