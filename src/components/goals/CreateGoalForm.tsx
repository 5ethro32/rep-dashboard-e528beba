
import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types/goals.types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateGoalFormProps {
  onSuccess: () => void;
  teams: Team[];
  selectedTeam: Team | null;
}

interface ProductTemplate {
  name: string;
  quantity: number;
  price: number;
}

const PREDEFINED_PRODUCTS: ProductTemplate[] = [
  { name: "Quetiapine Xl 50mg", quantity: 20, price: 25.00 },
  { name: "Iso Mono 10mg", quantity: 200, price: 2.40 },
  { name: "Erythromycin Tabs 250mg", quantity: 150, price: 4.75 },
  { name: "Gabapentin 600mg Tabs", quantity: 50, price: 8.99 },
  { name: "Co-codamol 30/500 Caplets", quantity: 1000, price: 2.79 },
  { name: "Salbutamol 5mg Steri Neb", quantity: 35, price: 10.99 }
];

const CreateGoalForm = ({ onSuccess, teams, selectedTeam }: CreateGoalFormProps) => {
  const queryClient = useQueryClient();
  const [goalName, setGoalName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (selectedTeam) {
      setTeamId(selectedTeam.id);
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedProduct) {
      const product = PREDEFINED_PRODUCTS.find(p => p.name === selectedProduct);
      if (product) {
        setQuantity(product.quantity.toString());
        setPrice(product.price.toFixed(2));
      }
    }
  }, [selectedProduct]);

  const createGoal = useMutation({
    mutationFn: async () => {
      if (!goalName.trim() || !teamId || !selectedProduct || !quantity || !price) {
        throw new Error('All fields are required');
      }

      const { data, error } = await supabase
        .from('goals')
        .insert([{
          name: goalName.trim(),
          team_id: teamId,
          product_name: selectedProduct,
          target_quantity: parseInt(quantity),
          price: parseFloat(price),
          end_date: endDate || null
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: `Goal "${goalName}" has been created successfully.`,
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create goal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const resetForm = () => {
    setGoalName('');
    if (!selectedTeam) setTeamId('');
    setSelectedProduct('');
    setQuantity('');
    setPrice('');
    setEndDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate();
  };

  const handleProductChange = (value: string) => {
    setSelectedProduct(value);
    const product = PREDEFINED_PRODUCTS.find(p => p.name === value);
    if (product) {
      setQuantity(product.quantity.toString());
      setPrice(product.price.toFixed(2));
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="grid w-full gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Enter goal name"
                disabled={createGoal.isPending}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="teamId">Team</Label>
              <Select 
                value={teamId} 
                onValueChange={(value) => setTeamId(value)}
                disabled={createGoal.isPending || !!selectedTeam}
              >
                <SelectTrigger id="teamId">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="product">Product</Label>
              <Select 
                value={selectedProduct} 
                onValueChange={handleProductChange}
                disabled={createGoal.isPending}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_PRODUCTS.map((product) => (
                    <SelectItem key={product.name} value={product.name}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="quantity">Target Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  placeholder="Quantity"
                  disabled={createGoal.isPending}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="price">Price (£)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  disabled={createGoal.isPending}
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={createGoal.isPending}
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={
                  createGoal.isPending || 
                  !goalName.trim() || 
                  !teamId || 
                  !selectedProduct || 
                  !quantity || 
                  !price
                }
              >
                {createGoal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Goal
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateGoalForm;
