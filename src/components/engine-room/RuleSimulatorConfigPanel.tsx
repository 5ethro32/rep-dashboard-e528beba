
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, RefreshCw, Sliders, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RuleSimulatorConfigPanelProps {
  onRunSimulation: (config: any) => void;
}

const RuleSimulatorConfigPanel: React.FC<RuleSimulatorConfigPanelProps> = ({ onRunSimulation }) => {
  // Updated rule configuration to match the new structure
  const [ruleConfig, setRuleConfig] = useState({
    // For Rule 1 (AVC < ML)
    marketLowUplift: 3, // ML + 3%
    costMarkup: 12, // Cost + 12%
    
    // Usage-based uplift is now handled directly in the simulator
    
    // Margin caps (for items ≤ £1.00 AVC)
    marginCaps: {
      group1_2: 10, // 10% margin cap for groups 1-2
      group3_4: 20, // 20% margin cap for groups 3-4
      group5_6: 30  // 30% margin cap for groups 5-6
    },
    
    // Global minimum margin
    globalMarginFloor: 0 // 0% minimum margin (disabled by default)
  });

  // Handle market low uplift percentage change
  const handleMarketLowUpliftChange = (value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      marketLowUplift: value[0]
    }));
  };

  // Handle cost markup percentage change
  const handleCostMarkupChange = (value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      costMarkup: value[0]
    }));
  };

  // Handle margin cap changes
  const handleMarginCapChange = (group: string, value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      marginCaps: {
        ...prev.marginCaps,
        [group]: value[0]
      }
    }));
  };

  // Handle global margin floor change
  const handleMarginFloorChange = (value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      globalMarginFloor: value[0]
    }));
  };

  // Reset configuration to defaults
  const handleResetConfig = () => {
    setRuleConfig({
      marketLowUplift: 3,
      costMarkup: 12,
      marginCaps: {
        group1_2: 10,
        group3_4: 20,
        group5_6: 30
      },
      globalMarginFloor: 0
    });
  };

  // Rules tooltips to help explain the differences
  const ruleTooltips = {
    rule1: "Applied when Average Cost (AVC) is LESS THAN Market Low (ML).",
    rule2: "Applied when Average Cost (AVC) is GREATER THAN OR EQUAL TO Market Low (ML).",
    uplift: "Usage-based uplift depends on Usage Rank: Ranks 1-2: 0%, Ranks 3-4: 1%, Ranks 5-6: 2%"
  };

  // Prepare config for simulation (convert to format expected by the simulation engine)
  const prepareConfigForSimulation = () => {
    return {
      rule1: {
        marginCaps: {
          group1_2: ruleConfig.marginCaps.group1_2,
          group3_4: ruleConfig.marginCaps.group3_4,
          group5_6: ruleConfig.marginCaps.group5_6,
        },
        marketLowUplift: ruleConfig.marketLowUplift,
        costMarkup: ruleConfig.costMarkup
      },
      rule2: {
        marketLowUplift: ruleConfig.marketLowUplift,
        costMarkup: ruleConfig.costMarkup
      },
      globalMarginFloor: ruleConfig.globalMarginFloor
    };
  };

  return (
    <div className="space-y-6">
      {/* Configuration cards */}
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Rule Configuration</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-xs">
                      This simulator allows you to adjust pricing rule parameters according to REVA's pricing algorithm.
                      Rules are applied based on the relationship between Average Cost (AVC) and Market Low (ML).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetConfig}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset to Defaults
            </Button>
          </div>
          
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="margincaps">Margin Caps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-gray-800/30 rounded-md space-y-2">
                <p><strong>Rule 1:</strong> Applied when Average Cost is less than Market Low.</p>
                <p><strong>Rule 2:</strong> Applied when Average Cost is greater than or equal to Market Low.</p>
                <p><strong>Usage-based Uplift:</strong> Automatically applied based on usage rank:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Ranks 1-2: 0% uplift</li>
                    <li>Ranks 3-4: 1% uplift</li>
                    <li>Ranks 5-6: 2% uplift</li>
                  </ul>
                </p>
              </div>
              
              {/* Market Low Uplift */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Market Low Uplift</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>ML Uplift: {ruleConfig.marketLowUplift}%</Label>
                  </div>
                  <Slider
                    value={[ruleConfig.marketLowUplift]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={handleMarketLowUpliftChange}
                    className="py-4"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Standard percentage uplift applied to Market Low (ML). Default: 3%.
                  </p>
                </div>
              </div>
              
              {/* Cost Markup */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Cost Markup</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Cost Markup: {ruleConfig.costMarkup}%</Label>
                  </div>
                  <Slider
                    value={[ruleConfig.costMarkup]}
                    min={5}
                    max={30}
                    step={1}
                    onValueChange={handleCostMarkupChange}
                    className="py-4"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Standard percentage markup applied to Average Cost (AVC). Default: 12%.
                  </p>
                </div>
              </div>
              
              {/* Global Minimum Margin */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Global Minimum Margin</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Minimum Margin: {ruleConfig.globalMarginFloor}%</Label>
                  </div>
                  <Slider
                    value={[ruleConfig.globalMarginFloor]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={handleMarginFloorChange}
                    className="py-4"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Items with margins below this threshold will have their prices adjusted to meet this minimum.
                    Set to 0% to disable this feature.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="margincaps" className="space-y-6">
              <div className="bg-amber-900/20 text-amber-200 p-3 rounded-md mb-3 text-xs">
                <strong>Note:</strong> Margin caps are only applied to items with an Average Cost of £1.00 or less.
                This ensures the cap only affects lower value items.
              </div>
              
              <div className="space-y-6">
                {/* Groups 1-2 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Groups 1-2: {ruleConfig.marginCaps.group1_2}%</Label>
                    <span className="text-xs text-muted-foreground">Low Usage</span>
                  </div>
                  <Slider
                    value={[ruleConfig.marginCaps.group1_2]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleMarginCapChange('group1_2', value)}
                    className="py-4"
                  />
                </div>
                
                {/* Groups 3-4 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Groups 3-4: {ruleConfig.marginCaps.group3_4}%</Label>
                    <span className="text-xs text-muted-foreground">Medium Usage</span>
                  </div>
                  <Slider
                    value={[ruleConfig.marginCaps.group3_4]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleMarginCapChange('group3_4', value)}
                    className="py-4"
                  />
                </div>
                
                {/* Groups 5-6 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Groups 5-6: {ruleConfig.marginCaps.group5_6}%</Label>
                    <span className="text-xs text-muted-foreground">High Usage</span>
                  </div>
                  <Slider
                    value={[ruleConfig.marginCaps.group5_6]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleMarginCapChange('group5_6', value)}
                    className="py-4"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Run Simulation Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => onRunSimulation(prepareConfigForSimulation())}
          className="flex items-center gap-2"
        >
          <Sliders className="h-4 w-4" />
          Run Simulation
        </Button>
      </div>
    </div>
  );
};

export default RuleSimulatorConfigPanel;
