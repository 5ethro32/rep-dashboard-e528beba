import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyRepTable from './DailyRepTable';
import { 
  DailyRepTableData, 
  DailyRepTableComparisonData, 
  DailyRepTableSortConfig,
  DailyFilterOptions
} from '@/types/daily-rep-performance.types';

interface DailyRepTableWithTabsProps {
  data: DailyRepTableData[];
  comparisonData: DailyRepTableComparisonData[];
  sorting: DailyRepTableSortConfig;
  onSort: (column: DailyRepTableSortConfig['sortBy']) => void;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
  filters: DailyFilterOptions;
  dateRange: string; // For title display (e.g., "July MTD 2025")
  fetchRepDataForDepartment: (department: string) => Promise<{ data: DailyRepTableData[]; comparison: DailyRepTableComparisonData[]; }>;
}

type DepartmentTab = 'overall' | 'retail' | 'reva' | 'wholesale';

const DailyRepTableWithTabs: React.FC<DailyRepTableWithTabsProps> = ({
  data,
  comparisonData,
  sorting,
  onSort,
  isLoading = false,
  showChangeIndicators = true,
  filters,
  dateRange,
  fetchRepDataForDepartment
}) => {
  const [activeTab, setActiveTab] = useState<DepartmentTab>('overall');
  const [tabData, setTabData] = useState<DailyRepTableData[]>(data);
  const [tabComparisonData, setTabComparisonData] = useState<DailyRepTableComparisonData[]>(comparisonData);
  const [tabLoading, setTabLoading] = useState(false);

  // Handle tab change and fetch department-specific data
  const handleTabChange = async (newTab: DepartmentTab) => {
    console.log('📋 Tab changed to:', newTab);
    setActiveTab(newTab);
    
    if (newTab === 'overall') {
      // Use the overall data passed from parent
      setTabData(data);
      setTabComparisonData(comparisonData);
    } else {
      // Fetch department-specific data
      setTabLoading(true);
      try {
        const result = await fetchRepDataForDepartment(newTab);
        console.log('📊 Department data fetched:', result.data.length, 'reps');
        setTabData(result.data);
        setTabComparisonData(result.comparison);
      } catch (error) {
        console.error('❌ Error fetching department data:', error);
        setTabData([]);
        setTabComparisonData([]);
      } finally {
        setTabLoading(false);
      }
    }
  };

  // Update tab data when overall data changes
  useEffect(() => {
    if (activeTab === 'overall') {
      setTabData(data);
      setTabComparisonData(comparisonData);
    }
  }, [data, comparisonData, activeTab]);

  // Generate title and subtitle based on active tab
  const { title, subtitle } = useMemo(() => {
    const tabTitles = {
      overall: {
        title: `Overall Rep Performance (${dateRange})`,
        subtitle: 'Showing retail data with REVA and wholesale data combined into rep totals.'
      },
      retail: {
        title: `Retail Performance (${dateRange})`,
        subtitle: 'Showing retail data by rep.'
      },
      reva: {
        title: `REVA Performance (${dateRange})`,
        subtitle: 'Showing REVA data by rep.'
      },
      wholesale: {
        title: `Wholesale Performance (${dateRange})`,
        subtitle: 'Showing wholesale data by rep.'
      }
    };

    return tabTitles[activeTab];
  }, [activeTab, dateRange]);

  // Check if any data is available for the current tab
  const hasData = tabData.length > 0;

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-0">
        <div className="p-4 md:p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        
        <div className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as DepartmentTab)}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger 
                value="overall"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                Overall
              </TabsTrigger>
              <TabsTrigger 
                value="retail"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                Retail
              </TabsTrigger>
              <TabsTrigger 
                value="reva"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                REVA
              </TabsTrigger>
              <TabsTrigger 
                value="wholesale"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                Wholesale
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="mt-0">
              <DailyRepTable
                data={tabData}
                comparisonData={tabComparisonData}
                sorting={sorting}
                onSort={onSort}
                isLoading={isLoading || tabLoading}
                showChangeIndicators={showChangeIndicators}
              />
            </TabsContent>

            <TabsContent value="retail" className="mt-0">
              {hasData ? (
                <DailyRepTable
                  data={tabData}
                  comparisonData={tabComparisonData}
                  sorting={sorting}
                  onSort={onSort}
                  isLoading={isLoading || tabLoading}
                  showChangeIndicators={showChangeIndicators}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No data available for the selected filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reva" className="mt-0">
              {hasData ? (
                <DailyRepTable
                  data={tabData}
                  comparisonData={tabComparisonData}
                  sorting={sorting}
                  onSort={onSort}
                  isLoading={isLoading || tabLoading}
                  showChangeIndicators={showChangeIndicators}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No data available for the selected filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="wholesale" className="mt-0">
              {hasData ? (
                <DailyRepTable
                  data={tabData}
                  comparisonData={tabComparisonData}
                  sorting={sorting}
                  onSort={onSort}
                  isLoading={isLoading || tabLoading}
                  showChangeIndicators={showChangeIndicators}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No data available for the selected filters</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyRepTableWithTabs; 