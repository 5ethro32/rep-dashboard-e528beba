
import React, { useState, useEffect } from 'react';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Info, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import MetricCard from '@/components/MetricCard';
import LineChart from '@/components/LineChart';
import { simulateRuleChanges } from '@/utils/rule-simulator-utils';
import { useToast } from '@/hooks/use-toast';
import RuleSimulatorConfigPanel from '@/components/engine-room/RuleSimulatorConfigPanel';
import SimulationResults from '@/components/engine-room/SimulationResults';
import GroupImpactAnalysis from '@/components/engine-room/GroupImpactAnalysis';

const RuleSimulator = () => {
  const { engineData, isLoading } = useEngineRoom();
  const { toast } = useToast();
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('config');
  
  // If there's no data loaded, show an info message
  if (!engineData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>
            Please upload data in the Engine Dashboard before using the Rule Simulator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Handle running the simulation
  const handleRunSimulation = (ruleConfig: any) => {
    try {
      // Display updated rule structure toast to help users understand the changes
      toast({
        title: "Pricing Rules Applied with ULTIMATE Margin Cap",
        description: "Standard pricing rules determine initial price. Then as the ULTIMATE final step, margin caps are enforced for all low-cost items (≤£1.00).",
        duration: 6000
      });
      
      const result = simulateRuleChanges(engineData.items, ruleConfig);
      setSimulationResult(result);
      setActiveTab('results');
      
      // Add a specific toast message if we detected zero-cost margin cap items
      if (result.simulated.zeroCostMarginCapSkipped > 0) {
        toast({
          title: "Zero-cost items detected",
          description: `${result.simulated.zeroCostMarginCapSkipped} items with zero cost had margin caps skipped to preserve pricing.`,
          variant: "default",
          duration: 7000
        });
      }
      
      // Add a specific toast message for margin cap application
      toast({
        title: "ULTIMATE Margin caps enforced",
        description: `${result.simulated.marginCapApplied} low-cost items had margin caps applied as the ULTIMATE overriding rule.`,
        variant: "default",
        duration: 5000
      });
      
      toast({
        title: "Simulation complete",
        description: "Rule simulation has been processed successfully."
      });
    } catch (error) {
      console.error("Simulation error:", error);
      toast({
        title: "Error running simulation",
        description: "There was a problem processing the rule changes.",
        variant: "destructive"
      });
    }
  };
  
  // Handle exporting the simulation results
  const handleExportResults = () => {
    if (!simulationResult) return;
    
    try {
      // Build Excel export data from simulation result
      const exportData = {
        simulationConfig: simulationResult.config,
        baselineMetrics: simulationResult.baseline,
        simulatedMetrics: simulationResult.simulated,
        items: simulationResult.itemResults
      };
      
      // Create a blob with the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `rule-simulation-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export complete",
        description: "Simulation results exported successfully."
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting the simulation results.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pricing Rule Simulator</h1>
        
        {simulationResult && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportResults}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export Results
          </Button>
        )}
      </div>
      
      {/* Updated rule structure explanation card with emphasis on margin cap as ULTIMATE rule */}
      <Card className="mb-6 bg-blue-950/30 border-blue-800/50">
        <CardContent className="p-4 text-sm">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Updated Pricing Rule Structure with ULTIMATE Margin Cap
          </h3>
          <div className="space-y-2">
            <p><strong>Standard Pricing Rules:</strong></p>
            <p>1. <strong>Rule 1 (AVC &lt; ML):</strong> Applied when Average Cost is below Market Low</p>
            <p>2. <strong>Rule 2 (AVC ≥ ML):</strong> Applied when Average Cost is equal to or above Market Low</p>
            <p>3. <strong>Usage-based Uplift:</strong> 0% for Ranks 1-2, 1% for Ranks 3-4, 2% for Ranks 5-6</p>
            <p className="mt-2 font-semibold text-amber-500">ULTIMATE OVERRIDING RULE:</p>
            <p><strong>Margin Caps for Low-Cost Items (≤ £1.00):</strong> Rank 1-2: 10% cap, Rank 3-4: 20% cap, Rank 5-6: 30% cap</p>
            <p><em>The margin cap is applied as the absolute final rule after all other price calculations.</em></p>
            <p><strong>Zero-Cost Handling:</strong> Margin caps are skipped for zero-cost items to prevent £0.00 pricing</p>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="config">Configure Rules</TabsTrigger>
          <TabsTrigger value="results" disabled={!simulationResult}>Results</TabsTrigger>
          <TabsTrigger value="groups" disabled={!simulationResult}>Group Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config">
          <RuleSimulatorConfigPanel onRunSimulation={handleRunSimulation} />
        </TabsContent>
        
        <TabsContent value="results">
          {simulationResult && (
            <SimulationResults result={simulationResult} />
          )}
        </TabsContent>
        
        <TabsContent value="groups">
          {simulationResult && (
            <GroupImpactAnalysis result={simulationResult} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RuleSimulator;
