
// Excel processing web worker
// This worker handles heavy Excel processing in a separate thread

import * as XLSX from 'xlsx';

// Listen for messages from the main thread
self.onmessage = async (event) => {
  try {
    const { action, data, file } = event.data;
    
    switch (action) {
      case 'process': {
        // Send progress updates
        self.postMessage({ type: 'progress', progress: 10 });
        
        // Parse the file data
        const workbook = XLSX.read(data, { type: 'array' });
        self.postMessage({ type: 'progress', progress: 30 });
        
        // Get the first sheet
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }
        
        // Extract raw data from the first sheet
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
        self.postMessage({ type: 'progress', progress: 50 });
        
        if (rawData.length === 0) {
          throw new Error('Excel sheet is empty. Please upload a file with data.');
        }
        
        // Send extracted data back to the main thread
        self.postMessage({ 
          type: 'data', 
          rawData: rawData,
          fileName: file.name,
          totalRows: rawData.length
        });
        
        self.postMessage({ type: 'progress', progress: 80 });
      }
      break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message || 'Unknown error in worker' });
  }
};

// This prevents TypeScript errors with the self reference
export {};
