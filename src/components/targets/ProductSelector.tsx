import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Package, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductTarget {
  product_name: string;
  product_code?: string;
  required_quantity?: number;
  target_amount?: number;
  weight?: number;
}

export type ChallengeMode = 'individual_products' | 'combined_products' | 'any_products';

interface ProductSelectorProps {
  targetType: 'profit' | 'product' | 'sales_volume' | 'customer_acquisition';
  challengeMode: ChallengeMode;
  products: ProductTarget[];
  onProductsChange: (products: ProductTarget[]) => void;
  onChallengeModeChange: (mode: ChallengeMode) => void;
  className?: string;
}

// Mock product database - in real app this would come from API
const AVAILABLE_PRODUCTS = [
  { name: 'Premium Widget A', code: 'PWA001', category: 'Widgets' },
  { name: 'Standard Widget B', code: 'SWB002', category: 'Widgets' },
  { name: 'Deluxe Gadget X', code: 'DGX003', category: 'Gadgets' },
  { name: 'Basic Gadget Y', code: 'BGY004', category: 'Gadgets' },
  { name: 'Pro Tool Z', code: 'PTZ005', category: 'Tools' },
  { name: 'Starter Kit Alpha', code: 'SKA006', category: 'Kits' },
  { name: 'Advanced Kit Beta', code: 'AKB007', category: 'Kits' },
  { name: 'Enterprise Solution', code: 'ES008', category: 'Solutions' },
];

const ProductSelector: React.FC<ProductSelectorProps> = ({
  targetType,
  challengeMode,
  products,
  onProductsChange,
  onChallengeModeChange,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(AVAILABLE_PRODUCTS.map(p => p.category)))];

  // Filter available products
  const filteredProducts = AVAILABLE_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const notAlreadySelected = !products.some(p => p.product_code === product.code);
    
    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  // Add a new product to the selection
  const addProduct = (product: typeof AVAILABLE_PRODUCTS[0]) => {
    const newProduct: ProductTarget = {
      product_name: product.name,
      product_code: product.code,
      required_quantity: targetType === 'product' || targetType === 'customer_acquisition' ? 1 : undefined,
      target_amount: targetType === 'profit' || targetType === 'sales_volume' ? 100 : undefined,
      weight: challengeMode === 'combined_products' ? 1 : undefined
    };
    
    onProductsChange([...products, newProduct]);
  };

  // Remove a product from the selection
  const removeProduct = (index: number) => {
    onProductsChange(products.filter((_, i) => i !== index));
  };

  // Update a product's target values
  const updateProduct = (index: number, field: keyof ProductTarget, value: string | number) => {
    const updatedProducts = products.map((product, i) => {
      if (i === index) {
        return { ...product, [field]: value };
      }
      return product;
    });
    onProductsChange(updatedProducts);
  };

  // Get the appropriate input label and placeholder based on target type
  const getTargetInputInfo = () => {
    switch (targetType) {
      case 'profit':
        return { label: 'Target Profit (£)', placeholder: '0.00', step: '0.01' };
      case 'sales_volume':
        return { label: 'Target Sales (£)', placeholder: '0.00', step: '0.01' };
      case 'product':
        return { label: 'Target Quantity', placeholder: '0', step: '1' };
      case 'customer_acquisition':
        return { label: 'Target Customers', placeholder: '0', step: '1' };
      default:
        return { label: 'Target Value', placeholder: '0', step: '1' };
    }
  };

  const targetInputInfo = getTargetInputInfo();

  // Calculate total target for combined mode
  const getTotalTarget = () => {
    if (challengeMode !== 'combined_products') return null;
    
    if (targetType === 'profit' || targetType === 'sales_volume') {
      return products.reduce((sum, p) => sum + (p.target_amount || 0), 0);
    } else {
      return products.reduce((sum, p) => sum + (p.required_quantity || 0), 0);
    }
  };

  const totalTarget = getTotalTarget();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Challenge Mode Selection */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Challenge Mode</CardTitle>
          <CardDescription className="text-gray-400">
            Choose how products are evaluated in this challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onChallengeModeChange('individual_products')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                challengeMode === 'individual_products'
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-gray-600 hover:border-gray-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-white">Individual Products</span>
              </div>
              <p className="text-sm text-gray-400">
                Separate targets for each product. First to complete any product wins.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChallengeModeChange('combined_products')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                challengeMode === 'combined_products'
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-gray-600 hover:border-gray-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="font-medium text-white">Combined Target</span>
              </div>
              <p className="text-sm text-gray-400">
                Progress across all products counts toward one total target.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChallengeModeChange('any_products')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                challengeMode === 'any_products'
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-gray-600 hover:border-gray-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-white">Any Products</span>
              </div>
              <p className="text-sm text-gray-400">
                Sales from any of these products count toward the target.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Select Products</CardTitle>
          <CardDescription className="text-gray-400">
            Choose which products are included in this challenge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-white text-sm">Search Products</Label>
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-white text-sm">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available Products */}
          {filteredProducts.length > 0 && (
            <div>
              <Label className="text-white text-sm mb-2 block">Available Products</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.code}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 text-left transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{product.name}</p>
                      <p className="text-gray-400 text-xs">{product.code} • {product.category}</p>
                    </div>
                    <Plus className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Products */}
      {products.length > 0 && (
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Selected Products</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure targets for each selected product
                </CardDescription>
              </div>
              {totalTarget !== null && (
                <Badge variant="secondary" className="bg-blue-600">
                  Total Target: {targetType === 'profit' || targetType === 'sales_volume' 
                    ? `£${totalTarget.toLocaleString()}` 
                    : `${totalTarget} ${targetType === 'product' ? 'units' : 'customers'}`
                  }
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={index} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{product.product_name}</h4>
                      <p className="text-gray-400 text-sm">{product.product_code}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Target Value Input */}
                    <div>
                      <Label className="text-white text-sm">{targetInputInfo.label}</Label>
                      <Input
                        type="number"
                        step={targetInputInfo.step}
                        placeholder={targetInputInfo.placeholder}
                        value={
                          targetType === 'profit' || targetType === 'sales_volume'
                            ? product.target_amount || ''
                            : product.required_quantity || ''
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const field = targetType === 'profit' || targetType === 'sales_volume'
                            ? 'target_amount'
                            : 'required_quantity';
                          updateProduct(index, field, value);
                        }}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                    </div>

                    {/* Weight Input for Combined Mode */}
                    {challengeMode === 'combined_products' && (
                      <div>
                        <Label className="text-white text-sm">Weight</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="1.0"
                          value={product.weight || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 1;
                            updateProduct(index, 'weight', value);
                          }}
                          className="bg-gray-600 border-gray-500 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Higher weight = more contribution to total
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Mode Explanation */}
      {products.length > 0 && (
        <Card className="bg-blue-900/20 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Challenge Rules</h4>
                <p className="text-blue-200 text-sm">
                  {challengeMode === 'individual_products' && 
                    "Participants compete on each product separately. First to reach any product target wins."
                  }
                  {challengeMode === 'combined_products' && 
                    `Participants' progress across all products is combined. First to reach £${totalTarget?.toLocaleString() || 0} total wins.`
                  }
                  {challengeMode === 'any_products' && 
                    "Sales from any of the selected products count toward the main target. Products act as qualifying criteria."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductSelector; 