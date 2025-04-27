import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/client';
import { 
  Check, 
  Trash2, 
  Plus, 
  ShoppingBasket, 
  PenLine,
  CircleCheck,
  Circle,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Define types for shopping list
interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  aisle?: string;
  isChecked: boolean;
  recipeId?: number;
  recipeName?: string;
}

// Group by aisle or category
interface GroupedItems {
  [key: string]: ShoppingListItem[];
}

const ShoppingList = () => {
  const apiClient = useApiClient();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  
  // Mock shopping list data - in a real app, this would come from an API
  const { data: shoppingList, isLoading, refetch } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: async () => {
      try {
        // This would be replaced with an actual API call
        // const response = await apiClient.get<{ success: boolean, items: ShoppingListItem[] }>('/shopping-list');
        
        // Mock data for development
        const mockItems: ShoppingListItem[] = [
          { id: 1, name: 'Chicken breast', quantity: 2, unit: 'lb', aisle: 'Meat', isChecked: false },
          { id: 2, name: 'Spinach', quantity: 1, unit: 'bag', aisle: 'Produce', isChecked: false },
          { id: 3, name: 'Brown rice', quantity: 1, unit: 'cup', aisle: 'Grains', isChecked: true },
          { id: 4, name: 'Olive oil', quantity: 0.25, unit: 'cup', aisle: 'Oils & Vinegars', isChecked: false },
          { id: 5, name: 'Garlic', quantity: 3, unit: 'cloves', aisle: 'Produce', isChecked: false },
          { id: 6, name: 'Salt', quantity: 1, unit: 'tsp', aisle: 'Spices', isChecked: true },
          { id: 7, name: 'Black pepper', quantity: 0.5, unit: 'tsp', aisle: 'Spices', isChecked: false },
          { id: 8, name: 'Lemon', quantity: 1, unit: '', aisle: 'Produce', isChecked: false, recipeId: 123, recipeName: 'Lemon Chicken' },
          { id: 9, name: 'Butter', quantity: 2, unit: 'tbsp', aisle: 'Dairy', isChecked: false, recipeId: 123, recipeName: 'Lemon Chicken' },
        ];
        
        return {
          success: true,
          items: mockItems
        };
      } catch (error) {
        console.error('Error fetching shopping list:', error);
        throw new Error('Failed to fetch shopping list');
      }
    }
  });
  
  // Group items by aisle
  const groupItemsByAisle = (items: ShoppingListItem[]): GroupedItems => {
    if (!items) return {};
    
    return items.reduce((grouped, item) => {
      const aisle = item.aisle || 'Other';
      if (!grouped[aisle]) {
        grouped[aisle] = [];
      }
      grouped[aisle].push(item);
      return grouped;
    }, {} as GroupedItems);
  };
  
  // Filter items by search query
  const filteredItems = shoppingList?.items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Get all active (unchecked) items
  const activeItems = filteredItems.filter(item => !item.isChecked);
  
  // Get all completed (checked) items
  const completedItems = filteredItems.filter(item => item.isChecked);
  
  // Group active items by aisle
  const groupedActiveItems = groupItemsByAisle(activeItems);
  
  // Handle adding a new item
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    try {
      // In a real app, this would make an API call
      // await apiClient.post('/shopping-list', {
      //   name: newItemName,
      //   quantity: parseFloat(newItemQuantity) || 1,
      //   unit: newItemUnit
      // });
      
      // For now, just show a success message
      toast.success(`Added ${newItemName} to your shopping list`);
      
      // Clear form
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemUnit('');
      
      // Refresh list
      refetch();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item to shopping list');
    }
  };
  
  // Handle toggling an item's checked status
  const handleToggleItem = async (item: ShoppingListItem) => {
    try {
      // In a real app, this would make an API call
      // await apiClient.put(`/shopping-list/${item.id}`, {
      //   ...item,
      //   isChecked: !item.isChecked
      // });
      
      // For now, just show a success message
      toast.success(`${!item.isChecked ? 'Checked off' : 'Unmarked'} ${item.name}`);
      
      // Refresh list
      refetch();
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Failed to update item');
    }
  };
  
  // Handle deleting an item
  const handleDeleteItem = async (item: ShoppingListItem) => {
    try {
      // In a real app, this would make an API call
      // await apiClient.delete(`/shopping-list/${item.id}`);
      
      // For now, just show a success message
      toast.success(`Removed ${item.name} from your shopping list`);
      
      // Refresh list
      refetch();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };
  
  // Handle editing an item
  const handleUpdateItem = async () => {
    if (!editingItem) return;
    
    try {
      // In a real app, this would make an API call
      // await apiClient.put(`/shopping-list/${editingItem.id}`, editingItem);
      
      // For now, just show a success message
      toast.success(`Updated ${editingItem.name}`);
      
      // Close edit dialog
      setEditingItem(null);
      
      // Refresh list
      refetch();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };
  
  // Handle clearing completed items
  const handleClearCompleted = async () => {
    try {
      // In a real app, this would make an API call
      // await apiClient.delete('/shopping-list/completed');
      
      // For now, just show a success message
      toast.success('Cleared all completed items');
      
      // Refresh list
      refetch();
    } catch (error) {
      console.error('Error clearing completed items:', error);
      toast.error('Failed to clear completed items');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shopping List</h1>
          <p className="text-muted-foreground">
            {activeItems.length} items remaining
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add an item to your shopping list
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="item-name" className="text-sm font-medium">
                    Item Name
                  </label>
                  <Input
                    id="item-name"
                    placeholder="e.g., Milk"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="item-quantity" className="text-sm font-medium">
                      Quantity
                    </label>
                    <Input
                      id="item-quantity"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="item-unit" className="text-sm font-medium">
                      Unit
                    </label>
                    <Select
                      value={newItemUnit}
                      onValueChange={setNewItemUnit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="pkg">pkg</SelectItem>
                        <SelectItem value="can">can</SelectItem>
                        <SelectItem value="bottle">bottle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={handleAddItem}>Add to List</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active Items ({activeItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedItems.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              {activeItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBasket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No matching items found' : 'Your shopping list is empty'}
                  </p>
                  
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      className="mt-2"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedActiveItems).map(([aisle, items]) => (
                    <div key={aisle}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {aisle}
                      </h3>
                      <div className="space-y-1">
                        {items.map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between py-2 hover:bg-muted/40 px-2 rounded-md group"
                          >
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleItem(item)}
                                className="rounded-full p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              >
                                <Circle className="h-5 w-5" />
                              </button>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{item.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {item.quantity} {item.unit}
                                  </span>
                                </div>
                                
                                {item.recipeName && (
                                  <div className="text-xs text-muted-foreground">
                                    From: {item.recipeName}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingItem(item)}
                                  >
                                    <PenLine className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Item</DialogTitle>
                                  </DialogHeader>
                                  
                                  {editingItem && (
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                          Item Name
                                        </label>
                                        <Input
                                          value={editingItem.name}
                                          onChange={(e) => setEditingItem({
                                            ...editingItem,
                                            name: e.target.value
                                          })}
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">
                                            Quantity
                                          </label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={editingItem.quantity}
                                            onChange={(e) => setEditingItem({
                                              ...editingItem,
                                              quantity: parseFloat(e.target.value) || 0
                                            })}
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">
                                            Unit
                                          </label>
                                          <Select
                                            value={editingItem.unit}
                                            onValueChange={(value) => setEditingItem({
                                              ...editingItem,
                                              unit: value
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="">None</SelectItem>
                                              <SelectItem value="lb">lb</SelectItem>
                                              <SelectItem value="oz">oz</SelectItem>
                                              <SelectItem value="cup">cup</SelectItem>
                                              <SelectItem value="tbsp">tbsp</SelectItem>
                                              <SelectItem value="tsp">tsp</SelectItem>
                                              <SelectItem value="g">g</SelectItem>
                                              <SelectItem value="kg">kg</SelectItem>
                                              <SelectItem value="ml">ml</SelectItem>
                                              <SelectItem value="l">l</SelectItem>
                                              <SelectItem value="pkg">pkg</SelectItem>
                                              <SelectItem value="can">can</SelectItem>
                                              <SelectItem value="bottle">bottle</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <DialogFooter>
                                    <Button onClick={handleUpdateItem}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteItem(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {completedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No completed items
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearCompleted}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {completedItems.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between py-2 hover:bg-muted/40 px-2 rounded-md group"
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleItem(item)}
                            className="rounded-full p-1 text-primary hover:bg-primary/10"
                          >
                            <CircleCheck className="h-5 w-5" />
                          </button>
                          
                          <div>
                            <div className="flex items-center gap-2 line-through text-muted-foreground">
                              <span>{item.name}</span>
                              <span className="text-sm">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};

export default ShoppingList;