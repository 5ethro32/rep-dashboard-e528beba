
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { processExcelFile } from '@/utils/excel-utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DataUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setDetailedError(null);

    try {
      // Check file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        throw new Error('Invalid file format. Please upload an Excel file (.xlsx or .xls)');
      }

      console.log('Processing file:', file.name);
      const result = await processExcelFile(file);
      
      // Store the processed data in localStorage
      localStorage.setItem('repPerformanceData', JSON.stringify(result));
      
      toast({
        title: "Data uploaded successfully",
        description: "Your performance data has been updated.",
      });
      
      // Navigate to the performance dashboard
      navigate('/rep-performance');
    } catch (err: any) {
      console.error('Upload error:', err);
      
      const errorMessage = err.message || 'An error occurred while processing the file';
      setError(errorMessage);
      
      // Set more detailed error information
      if (errorMessage.includes('not found')) {
        setDetailedError(`Missing required sheet. Please ensure your Excel file includes sheets named: overall, rep, reva, wholesale.`);
      } else if (errorMessage.includes('Missing required field')) {
        setDetailedError(`Missing columns in the Excel file. Each sheet must contain these columns: rep, spend, profit, margin, packs, activeAccounts, totalAccounts.`);
      } else {
        setDetailedError('Please check that your Excel file matches the expected structure shown below.');
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
                  Your Excel file should have sheets named: overall, rep, reva, wholesale.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Tabs defaultValue="structure" className="w-full">
              <TabsList className="bg-gray-800/50 border-gray-700">
                <TabsTrigger value="structure">File Structure</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
              </TabsList>
              <TabsContent value="structure" className="mt-4">
                <div className="text-xs text-gray-400 space-y-2">
                  <p className="font-semibold">Expected Excel Structure:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Each sheet needs columns: rep, spend, profit, margin, packs, activeAccounts, totalAccounts</li>
                    <li>Optional columns: profitPerActiveShop, profitPerPack, activeRatio (will be calculated if missing)</li>
                    <li>Sheet names should be: overall, rep, reva, wholesale</li>
                    <li>Include a "repChanges" sheet for YoY changes with columns for rep, spend, profit, margin, etc.</li>
                  </ul>
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
