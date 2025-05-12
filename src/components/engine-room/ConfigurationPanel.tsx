import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Undo2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RuleConfig } from '@/types/engine-room.types';

interface ConfigurationPanelProps {
  currentConfig: RuleConfig;
  onConfigChange: (config: RuleConfig) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  currentConfig,
  onConfigChange
}) => {
  const [configValues, setConfigValues] = useState<RuleConfig>({ ...currentConfig });
  const [enableVersioning, setEnableVersioning] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle change for a specific field
  const handleChange = (
    rule: 'rule1' | 'rule2',
    group: 'group1_2' | 'group3_4' | 'group5_6',
    trend: 'trend_down' | 'trend_flat_up',
    value: string
  ) => {
    // Convert to number and validate
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setConfigValues(prev => ({
        ...prev,
        [rule]: {
          ...prev[rule],
          [group]: {
            ...prev[rule][group],
            [trend]: numValue
          }
        }
      }));
      setHasChanges(true);
    }
  };

  // Reset to current config
  const handleReset = () => {
    setConfigValues({ ...currentConfig });
    setHasChanges(false);
  };

  // Save configuration
  const handleSave = () => {
    onConfigChange(configValues);
    setHasChanges(false);
  };

  // Render rule configuration section
  const renderRuleSection = (
    title: string, 
    description: string,
    rule: 'rule1' | 'rule2'
  ) => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Group 1-2 */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Group 1-2 (Fast Moving)</h4>
              <div className="space-y-2">
                <Label htmlFor={`${rule}-g12-down`}>Trend Down Multiplier</Label>
                <Input
                  id={`${rule}-g12-down`}
                  type="number"
                  step="0.01"
                  value={configValues[rule].group1_2.trend_down}
                  onChange={(e) => handleChange(rule, 'group1_2', 'trend_down', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${rule}-g12-up`}>Trend Flat/Up Multiplier</Label>
                <Input
                  id={`${rule}-g12-up`}
                  type="number"
                  step="0.01"
                  value={configValues[rule].group1_2.trend_flat_up}
                  onChange={(e) => handleChange(rule, 'group1_2', 'trend_flat_up', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Group 3-4 */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Group 3-4 (Medium Moving)</h4>
              <div className="space-y-2">
                <Label htmlFor={`${rule}-g34-down`}>Trend Down Multiplier</Label>
                <Input
                  id={`${rule}-g34-down`}
                  type="number"
                  step="0.01"
                  value={configValues[rule].group3_4.trend_down}
                  onChange={(e) => handleChange(rule, 'group3_4', 'trend_down', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${rule}-g34-up`}>Trend Flat/Up Multiplier</Label>
                <Input
                  id={`${rule}-g34-up`}
                  type="number"
                  step="0.01"
                  value={configValues[rule].group3_4.trend_flat_up}
                  onChange={(e) => handleChange(rule, 'group3_4', 'trend_flat_up', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Group 5-6 */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Group 5-6 (Slow Moving)</h4>
              <div className="space-y-2">
                <Label htmlFor={`${rule}-g56-down`}>Trend Down Multiplier</Label>
                <Input
                  id={`${rule}-g56-down`}
                  type="number"
                  step="0.01"
                  value={configValues[rule].group5_6.trend_down}
                  onChange={(e) => handleChange(rule, 'group5_6', 'trend_down', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${rule}-g56-up`}>Trend Flat/Up Multiplier</Label>
                <Input
                  id={`${rule}-g56-up`}
                  type="number"
                  step="0.01"
                  value={configValues[rule].group5_6.trend_flat_up}
                  onChange={(e) => handleChange(rule, 'group5_6', 'trend_flat_up', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Rule Configuration</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="version-control"
              checked={enableVersioning}
              onCheckedChange={setEnableVersioning}
            />
            <Label htmlFor="version-control">Enable version control</Label>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-6">
        <p>Customize rule multipliers to adjust pricing calculations. Changes will apply to future price calculations.</p>
      </div>

      {/* Rule 1 Configuration */}
      {renderRuleSection(
        "Rule 1 Configuration",
        "Applied when Average Cost is less than Market Low",
        "rule1"
      )}

      {/* Rule 2 Configuration */}
      {renderRuleSection(
        "Rule 2 Configuration",
        "Applied when Average Cost is greater than or equal to Market Low",
        "rule2"
      )}

      {/* Flag Thresholds */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Flag Thresholds</CardTitle>
          <CardDescription>Customize thresholds for flagging items for review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rule1-threshold">Rule 1 Flag Threshold (%)</Label>
              <Input
                id="rule1-threshold"
                type="number"
                defaultValue="10"
                className="w-full"
                placeholder="Default: 10% above True Market Low"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Flag if price ≥ True Market Low × (1 + threshold%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule2-threshold">Rule 2 Flag Threshold (%)</Label>
              <Input
                id="rule2-threshold"
                type="number" 
                defaultValue="3"
                className="w-full"
                placeholder="Default: 3% minimum margin"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Flag if margin is below this percentage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center"
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
