
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Upload, AlertCircle, FileSpreadsheet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { processExcelFile } from '@/utils/excel-utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DataUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setDetailedError(null);
    setPreviewData(null);

    try {
      // Check file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        throw new Error('Invalid file format. Please upload an Excel file (.xlsx or .xls)');
      }

      console.log('Processing file:', file.name);
      const result = await processExcelFile(file);
      
      // Show preview of the raw data
      if (result.rawData && result.rawData.length > 0) {
        setPreviewData(result.rawData.slice(0, 5)); // Just show first 5 rows
      }
      
      // Store the processed data in localStorage
      localStorage.setItem('repPerformanceData', JSON.stringify(result));
      
      toast({
        title: "Data uploaded successfully",
        description: "Your performance data has been updated.",
        variant: "default",
      });
      
      // Navigate to the performance dashboard
      setTimeout(() => navigate('/rep-performance'), 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      
      const errorMessage = err.message || 'An error occurred while processing the file';
      setError(errorMessage);
      
      // Set more detailed error information
      if (errorMessage.includes('not found')) {
        setDetailedError(`Could not find expected data in your file. Please ensure your Excel file includes the following columns: Rep, Spend, Profit, Margin, Packs.`);
      } else if (errorMessage.includes('Missing required')) {
        setDetailedError(`Missing required columns in the Excel file. Your file must contain at least: Rep, Spend, and Profit columns.`);
      } else {
        setDetailedError('Please check that your Excel file contains the required columns shown below.');
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900 py-8 md:py-16 px-4">
      <div className="container max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 transition-all duration-300">
              <Home className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              <span className="text-sm md:text-base">Back to Home</span>
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 mb-6">
          Update Performance Data
        </h1>

        <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Upload Excel Data</CardTitle>
            <CardDescription className="text-gray-400">
              Upload your Excel file to update the rep performance dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                {detailedError && (
                  <div className="mt-2 text-xs bg-red-950/50 p-2 rounded border border-red-800/50">
                    {detailedError}
                  </div>
                )}
              </Alert>
            )}

            {previewData && previewData.length > 0 && (
              <div className="mb-6">
                <Alert className="mb-4 bg-green-900/30 border-green-800 text-white">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Upload Successful</AlertTitle>
                  <AlertDescription>Data preview (first 5 rows):</AlertDescription>
                </Alert>
                
                <div className="overflow-x-auto max-h-60 rounded border border-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(previewData[0]).map((key) => (
                          <TableHead key={key} className="text-gray-300 text-xs">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, i) => (
                            <TableCell key={i} className="text-gray-400 text-xs">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid w-full items-center gap-2">
                <label htmlFor="excel-file" className="text-sm font-medium text-gray-300">
                  Excel File
                </label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx, .xls"
                  className="cursor-pointer bg-gray-800/50 border-gray-700 text-white"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-400">
                  Your Excel file should include columns for: Rep, Spend, Profit, Margin, Packs.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Tabs defaultValue="structure" className="w-full">
              <TabsList className="bg-gray-800/50 border-gray-700">
                <TabsTrigger value="structure">Expected Columns</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
              </TabsList>
              <TabsContent value="structure" className="mt-4">
                <div className="text-xs text-gray-400 space-y-2">
                  <p className="font-semibold">Required Excel Columns:</p>
                  <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-white">Column Name</TableHead>
                          <TableHead className="text-white">Required</TableHead>
                          <TableHead className="text-white">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Rep</TableCell>
                          <TableCell className="text-green-400">Required</TableCell>
                          <TableCell>Name of the representative</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sub-Rep</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Secondary representative</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Account Ref</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Account reference code</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Account Name</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Name of the account</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Spend</TableCell>
                          <TableCell className="text-green-400">Required</TableCell>
                          <TableCell>Spending amount</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Cost</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Cost amount</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Credit</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Credit amount</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Profit</TableCell>
                          <TableCell className="text-green-400">Required</TableCell>
                          <TableCell>Profit amount</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Margin</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Profit margin</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Packs</TableCell>
                          <TableCell>Optional</TableCell>
                          <TableCell>Number of packs</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="template" className="mt-4">
                <div className="text-xs text-gray-400 space-y-2">
                  <p className="font-semibold flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Download a template file:
                  </p>
                  <p>For a sample Excel template, click the button below:</p>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1o6TAI1ON0GUsQejnOPQrNzYzXsT0gONBVWdWS4lTI-g/edit?usp=sharing" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2"
                  >
                    <Button variant="outline" size="sm" className="text-xs border-white/20 text-white hover:bg-white/10">
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                      View Template
                    </Button>
                  </a>
                </div>
              </TabsContent>
            </Tabs>
            <Button 
              className="w-full bg-finance-red hover:bg-red-700 mt-4" 
              disabled={isUploading}
              onClick={() => document.getElementById('excel-file')?.click()}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">○</span>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Data
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/rep-performance">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View Current Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
