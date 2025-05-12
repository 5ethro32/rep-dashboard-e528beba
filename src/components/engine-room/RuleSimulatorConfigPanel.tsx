
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
import { ChevronDown, RefreshCw, Sliders } from 'lucide-react';

interface RuleSimulatorConfigPanelProps {
  onRunSimulation: (config: any) => void;
}

const RuleSimulatorConfigPanel: React.FC<RuleSimulatorConfigPanelProps> = ({ onRunSimulation }) => {
  // Initial rule configuration
  const [ruleConfig, setRuleConfig] = useState({
    rule1: {
      marginCaps: {
        group1_2: 10,
        group3_4: 20,
        group5_6: 30
      },
      markups: {
        rule1a: {
          group1_2: 5,
          group3_4: 7.5,
          group5_6: 10
        },
        rule1b: {
          group1_2: 8,
          group3_4: 12,
          group5_6: 15
        }
      }
    },
    rule2: {
      markups: {
        rule2a: {
          group1_2: 3,
          group3_4: 5,
          group5_6: 7
        },
        rule2b: {
          group1_2: 5,
          group3_4: 8,
          group5_6: 10
        }
      }
    },
    globalMarginFloor: 5 // Minimum margin percentage
  });

  // Handle slider changes for rule 1 margin caps
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

  // Handle slider changes for rule 1 markups
  const handleRule1MarkupChange = (subRule: string, group: string, value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      rule1: {
        ...prev.rule1,
        markups: {
          ...prev.rule1.markups,
          [subRule]: {
            ...prev.rule1.markups[subRule as keyof typeof prev.rule1.markups],
            [group]: value[0]
          }
        }
      }
    }));
  };

  // Handle slider changes for rule 2 markups
  const handleRule2MarkupChange = (subRule: string, group: string, value: number[]) => {
    setRuleConfig(prev => ({
      ...prev,
      rule2: {
        ...prev.rule2,
        markups: {
          ...prev.rule2.markups,
          [subRule]: {
            ...prev.rule2.markups[subRule as keyof typeof prev.rule2.markups],
            [group]: value[0]
          }
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

  // Reset configuration to defaults
  const handleResetConfig = () => {
    setRuleConfig({
      rule1: {
        marginCaps: {
          group1_2: 10,
          group3_4: 20,
          group5_6: 30
        },
        markups: {
          rule1a: {
            group1_2: 5,
            group3_4: 7.5,
            group5_6: 10
          },
          rule1b: {
            group1_2: 8,
            group3_4: 12,
            group5_6: 15
          }
        }
      },
      rule2: {
        markups: {
          rule2a: {
            group1_2: 3,
            group3_4: 5,
            group5_6: 7
          },
          rule2b: {
            group1_2: 5,
            group3_4: 8,
            group5_6: 10
          }
        }
      },
      globalMarginFloor: 5
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration cards */}
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Rule Configuration</h3>
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
              <TabsTrigger value="rule1">Rule 1: Above Market Price</TabsTrigger>
              <TabsTrigger value="rule2">Rule 2: Below Market Price</TabsTrigger>
              <TabsTrigger value="general">General Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rule1" className="space-y-6">
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

              {/* Rule 1a Markups */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <span className="text-sm font-medium">Rule 1a: Cost Above Market (Markup %)</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {ruleConfig.rule1.markups.rule1a.group1_2}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.markups.rule1a.group1_2]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={(value) => handleRule1MarkupChange('rule1a', 'group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {ruleConfig.rule1.markups.rule1a.group3_4}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.markups.rule1a.group3_4]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={(value) => handleRule1MarkupChange('rule1a', 'group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {ruleConfig.rule1.markups.rule1a.group5_6}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.markups.rule1a.group5_6]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={(value) => handleRule1MarkupChange('rule1a', 'group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rule 1b Markups */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <span className="text-sm font-medium">Rule 1b: Cost Below Market (Markup %)</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {ruleConfig.rule1.markups.rule1b.group1_2}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.markups.rule1b.group1_2]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={(value) => handleRule1MarkupChange('rule1b', 'group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {ruleConfig.rule1.markups.rule1b.group3_4}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.markups.rule1b.group3_4]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={(value) => handleRule1MarkupChange('rule1b', 'group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {ruleConfig.rule1.markups.rule1b.group5_6}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule1.markups.rule1b.group5_6]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={(value) => handleRule1MarkupChange('rule1b', 'group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
            
            <TabsContent value="rule2" className="space-y-6">
              {/* Rule 2a Markups */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <span className="text-sm font-medium">Rule 2a: First 5% Below Market (Discount %)</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {ruleConfig.rule2.markups.rule2a.group1_2}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.markups.rule2a.group1_2]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => handleRule2MarkupChange('rule2a', 'group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {ruleConfig.rule2.markups.rule2a.group3_4}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.markups.rule2a.group3_4]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => handleRule2MarkupChange('rule2a', 'group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {ruleConfig.rule2.markups.rule2a.group5_6}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.markups.rule2a.group5_6]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => handleRule2MarkupChange('rule2a', 'group5_6', value)}
                        className="py-4"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rule 2b Markups */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-800/50 rounded-md">
                  <span className="text-sm font-medium">Rule 2b: More Than 5% Below Market (Discount %)</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4 mt-2">
                  <div className="space-y-6">
                    {/* Groups 1-2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 1-2: {ruleConfig.rule2.markups.rule2b.group1_2}%</Label>
                        <span className="text-xs text-muted-foreground">Low Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.markups.rule2b.group1_2]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => handleRule2MarkupChange('rule2b', 'group1_2', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 3-4 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 3-4: {ruleConfig.rule2.markups.rule2b.group3_4}%</Label>
                        <span className="text-xs text-muted-foreground">Medium Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.markups.rule2b.group3_4]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => handleRule2MarkupChange('rule2b', 'group3_4', value)}
                        className="py-4"
                      />
                    </div>
                    
                    {/* Groups 5-6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Groups 5-6: {ruleConfig.rule2.markups.rule2b.group5_6}%</Label>
                        <span className="text-xs text-muted-foreground">High Usage</span>
                      </div>
                      <Slider
                        value={[ruleConfig.rule2.markups.rule2b.group5_6]}
                        min={1}
                        max={20}
                        step={0.5}
                        onValueChange={(value) => handleRule2MarkupChange('rule2b', 'group5_6', value)}
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
                    Items with margins below this threshold will be flagged for review
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
          onClick={() => onRunSimulation(ruleConfig)}
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
