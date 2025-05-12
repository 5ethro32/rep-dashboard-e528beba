
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
  // Updated rule configuration to match actual implementation in engine-excel-utils.ts
  const [ruleConfig, setRuleConfig] = useState({
    rule1: {
      // Rule 1a and 1b (when Cost vs Market Low)
      group1_2: { trend_down: 1.00, trend_flat_up: 1.03 }, // Rule 1a: ML + 0%, Rule 1b: ML + 3%
      group3_4: { trend_down: 1.01, trend_flat_up: 1.04 }, // Rule 1a: ML + 1%, Rule 1b: ML + 4%
      group5_6: { trend_down: 1.02, trend_flat_up: 1.05 }, // Rule 1a: ML + 2%, Rule 1b: ML + 5%
      marginCaps: {
        group1_2: 10, // 10% margin cap for groups 1-2
        group3_4: 20, // 20% margin cap for groups 3-4
        group5_6: 30  // 30% margin cap for groups 5-6
      }
    },
    rule2: {
      // For Rule 2 cost-based pricing (single rule now)
      group1_2: 12, // Cost + 12%
      group3_4: 13, // Cost + 13%
      group5_6: 14  // Cost + 14%
    },
    globalMarginFloor: 5 // 5% minimum margin
  });

  // Handle Market Low percentage changes for Rule 1
  const handleRule1MLPercentChange = (trend: 'trend_down' | 'trend_flat_up', group: string, value: number[]) => {
    const groupKey = group as 'group1_2' | 'group3_4' | 'group5_6';
    setRuleConfig(prev => ({
      ...prev,
      rule1: {
        ...prev.rule1,
        [groupKey]: {
          ...prev.rule1[groupKey],
          [trend]: 1 + (value[0] / 100) // Convert percentage to multiplier
        }
      }
    }));
  };

  // Handle cost markup percentage changes for Rule 2 (simplified)
  const handleRule2MarkupChange = (group: string, value: number[]) => {
    const groupKey = group as 'group1_2' | 'group3_4' | 'group5_6';
    setRuleConfig(prev => ({
      ...prev,
      rule2: {
        ...prev.rule2,
        [groupKey]: value[0] // Keep as percentage
      }
    }));
  };

  // Handle margin cap changes
  const handleMarginCapChange = (group: string, value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      rule1: {
        ...prev.rule1,
        marginCaps: {
          ...prev.rule1.marginCaps,
          [group]: value[0]
        }
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

  // Reset configuration to defaults based on engine-excel-utils.ts
  const handleResetConfig = () => {
    setRuleConfig({
      rule1: {
        group1_2: { trend_down: 1.00, trend_flat_up: 1.03 },
        group3_4: { trend_down: 1.01, trend_flat_up: 1.04 },
        group5_6: { trend_down: 1.02, trend_flat_up: 1.05 },
        marginCaps: {
          group1_2: 10,
          group3_4: 20,
          group5_6: 30
        }
      },
      rule2: {
        group1_2: 12,
        group3_4: 13,
        group5_6: 14
      },
      globalMarginFloor: 5
    });
  };

  // Rules tooltips to help explain the differences
  const ruleTooltips = {
    rule1a: "Applied when cost is ABOVE or EQUAL TO market low price. Uses Market Low price plus a percentage based on usage group.",
    rule1b: "Applied when cost is BELOW market low price (within 5%). Uses Market Low price plus a percentage based on usage group.",
    rule2: "Applied for cost-based pricing when no market price is available or in other scenarios where cost-based pricing is needed."
  };

  // Prepare config for simulation (convert to format expected by the simulation engine)
  const prepareConfigForSimulation = () => {
    return {
      rule1: {
        marginCaps: {
          group1_2: ruleConfig.rule1.marginCaps.group1_2,
          group3_4: ruleConfig.rule1.marginCaps.group3_4,
          group5_6: ruleConfig.rule1.marginCaps.group5_6,
        },
        markups: {
          rule1a: {
            group1_2: Math.round((ruleConfig.rule1.group1_2.trend_down - 1) * 100),
            group3_4: Math.round((ruleConfig.rule1.group3_4.trend_down - 1) * 100),
            group5_6: Math.round((ruleConfig.rule1.group5_6.trend_down - 1) * 100),
          },
          rule1b: {
            group1_2: Math.round((ruleConfig.rule1.group1_2.trend_flat_up - 1) * 100),
            group3_4: Math.round((ruleConfig.rule1.group3_4.trend_flat_up - 1) * 100),
            group5_6: Math.round((ruleConfig.rule1.group5_6.trend_flat_up - 1) * 100),
          }
        }
      },
      rule2: {
        markups: {
          group1_2: ruleConfig.rule2.group1_2,
          group3_4: ruleConfig.rule2.group3_4,
          group5_6: ruleConfig.rule2.group5_6,
        }
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
                      This simulator allows you to adjust pricing rule parameters according to REVA's actual pricing algorithm. Rules are applied based on the relationship between cost and market price.
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
          
          <Tabs defaultValue="rule1">
            <TabsList className="mb-4">
              <TabsTrigger value="rule1">Rule 1: Market Price Rules</TabsTrigger>
              <TabsTrigger value="rule2">Rule 2: Cost-Based Rules</TabsTrigger>
              <TabsTrigger value="general">General Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rule1" className="space-y-6">
              {/* Rule explanation */}
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-gray-800/30 rounded-md">
                <p><strong>Rule 1:</strong> Applied when comparing cost to market low price.</p>
                <p className="mt-1"><strong>Rule 1a:</strong> Used when cost is above or equal to market price. Applies percentage markup to Market Low.</p>
                <p className="mt-1"><strong>Rule 1b:</strong> Used when cost is below market price (within 5%). Applies percentage markup to Market Low.</p>
              </div>
              
              {/* Rule 1 Margin Caps */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <span className="text-sm font-medium">Margin Caps by Group</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {ruleConfig.rule1.marginCaps.group1_2}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.marginCaps.group1_2]}
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
                        <Label>Groups 3-4: {ruleConfig.rule1.marginCaps.group3_4}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.marginCaps.group3_4]}
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
                        <Label>Groups 5-6: {ruleConfig.rule1.marginCaps.group5_6}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.marginCaps.group5_6]}
                        min={5}
                        max={50}
                        step={1}
                        onValueChange={(value) => handleMarginCapChange('group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rule 1a Market Low Markup for TrendDown */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rule 1a: Cost Above Market, Trend Down (ML Markup %)</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{ruleTooltips.rule1a}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {Math.round((ruleConfig.rule1.group1_2.trend_down - 1) * 100)}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[Math.round((ruleConfig.rule1.group1_2.trend_down - 1) * 100)]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleRule1MLPercentChange('trend_down', 'group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {Math.round((ruleConfig.rule1.group3_4.trend_down - 1) * 100)}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[Math.round((ruleConfig.rule1.group3_4.trend_down - 1) * 100)]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleRule1MLPercentChange('trend_down', 'group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {Math.round((ruleConfig.rule1.group5_6.trend_down - 1) * 100)}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[Math.round((ruleConfig.rule1.group5_6.trend_down - 1) * 100)]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleRule1MLPercentChange('trend_down', 'group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rule 1b Market Low Markup for TrendFlatUp */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rule 1b: Cost Below Market, Trend Flat/Up (ML Markup %)</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{ruleTooltips.rule1b}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {Math.round((ruleConfig.rule1.group1_2.trend_flat_up - 1) * 100)}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[Math.round((ruleConfig.rule1.group1_2.trend_flat_up - 1) * 100)]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleRule1MLPercentChange('trend_flat_up', 'group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {Math.round((ruleConfig.rule1.group3_4.trend_flat_up - 1) * 100)}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[Math.round((ruleConfig.rule1.group3_4.trend_flat_up - 1) * 100)]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleRule1MLPercentChange('trend_flat_up', 'group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {Math.round((ruleConfig.rule1.group5_6.trend_flat_up - 1) * 100)}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[Math.round((ruleConfig.rule1.group5_6.trend_flat_up - 1) * 100)]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => handleRule1MLPercentChange('trend_flat_up', 'group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
            
            <TabsContent value="rule2" className="space-y-6">
              {/* Rule explanation - Updated to match actual rule logic */}
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-gray-800/30 rounded-md">
                <p><strong>Rule 2:</strong> Applied for cost-based pricing when needed.</p>
                <p className="mt-1">These markups are applied directly to the cost when necessary, like when no market price is available.</p>
                <p className="mt-1">The same markup is used for both Trend Down and Trend Flat/Up scenarios.</p>
              </div>
              
              {/* Rule 2 Cost Markups - Simplified to a single rule */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rule 2: Cost-Based Pricing (Cost Markup %)</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{ruleTooltips.rule2}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {ruleConfig.rule2.group1_2}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.group1_2]}
                        min={5}
                        max={30}
                        step={1}
                        onValueChange={(value) => handleRule2MarkupChange('group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {ruleConfig.rule2.group3_4}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.group3_4]}
                        min={5}
                        max={30}
                        step={1}
                        onValueChange={(value) => handleRule2MarkupChange('group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {ruleConfig.rule2.group5_6}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.group5_6]}
                        min={5}
                        max={30}
                        step={1}
                        onValueChange={(value) => handleRule2MarkupChange('group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
            
            <TabsContent value="general" className="space-y-6">
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
                  </p>
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
