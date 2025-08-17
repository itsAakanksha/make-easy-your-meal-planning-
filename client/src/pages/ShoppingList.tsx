import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/client';
import { useSearchParams } from 'react-router-dom';
import { 
  Check, 
  Trash2, 
  Plus, 
  ShoppingBasket, 
  PenLine,
  CircleCheck,
  Circle,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card,  CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

// Dummy data for shopping list
const DUMMY_SHOPPING_LIST: ShoppingListItem[] = [
  {
    id: 1,
    name: "Chicken breast",
    quantity: 2,
    unit: "lb",
    aisle: "Meat & Seafood",
    isChecked: false,
    recipeId: 101,
    recipeName: "Chicken Stir Fry"
  },
  {
    id: 2,
    name: "Broccoli",
    quantity: 1,
    unit: "head",
    aisle: "Produce",
    isChecked: false,
    recipeId: 101,
    recipeName: "Chicken Stir Fry"
  },
  {
    id: 3,
    name: "Bell peppers",
    quantity: 2,
    unit: "",
    aisle: "Produce",
    isChecked: false,
    recipeId: 101,
    recipeName: "Chicken Stir Fry"
  },
  {
    id: 4,
    name: "Brown rice",
    quantity: 2,
    unit: "cup",
    aisle: "Grains",
    isChecked: true,
    recipeId: 101,
    recipeName: "Chicken Stir Fry"
  },
  {
    id: 5,
    name: "Soy sauce",
    quantity: 0.25,
    unit: "cup",
    aisle: "Condiments",
    isChecked: false,
    recipeId: 101,
    recipeName: "Chicken Stir Fry"
  },
  {
    id: 6,
    name: "Eggs",
    quantity: 12,
    unit: "",
    aisle: "Dairy & Eggs",
    isChecked: false,
    recipeId: 102,
    recipeName: "Breakfast Scramble"
  },
  {
    id: 7,
    name: "Milk",
    quantity: 1,
    unit: "gallon",
    aisle: "Dairy & Eggs",
    isChecked: false
  },
  {
    id: 8,
    name: "Bread",
    quantity: 1,
    unit: "loaf",
    aisle: "Bakery",
    isChecked: true
  },
  {
    id: 9,
    name: "Apples",
    quantity: 6,
    unit: "",
    aisle: "Produce",
    isChecked: false
  },
  {
    id: 10,
    name: "Pasta",
    quantity: 1,
    unit: "pkg",
    aisle: "Grains",
    isChecked: false,
    recipeId: 103,
    recipeName: "Pasta Primavera"
  }
];

const ShoppingList = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const mealPlanId = searchParams.get('mealPlanId');
  
  // Local state for dummy data
  const [dummyItems, setDummyItems] = useState<ShoppingListItem[]>(DUMMY_SHOPPING_LIST);
  const [useDummyData] = useState(true); // Set to true to force using dummy data
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  
  // Fetch shopping list
  const { data: shoppingList, isLoading, isError } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: async () => {
      if (useDummyData) {
        // Return dummy data
        return { success: true, items: dummyItems };
      }
      
      try {
        const response = await apiClient.get<{ success: boolean, items: ShoppingListItem[] }>('/shopping-list');
        
        if (response.success) {
          return response;
        }
        
        throw new Error('Failed to fetch shopping list');
      } catch (error) {
        console.error('Error fetching shopping list:', error);
        throw new Error('Failed to fetch shopping list');
      }
    }
  });
  
  // Generate shopping list from meal plan
  const generateShoppingListMutation = useMutation({
    mutationFn: async () => {
      if (useDummyData) {
        // Simulate API call
        return { success: true };
      }
      
      if (!mealPlanId) return null;
      
      return apiClient.post<{ success: boolean }>(`/mealplans/${mealPlanId}/shopping-list`);
    },
    onSuccess: () => {
      toast.success('Shopping list generated from meal plan');
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
    onError: (error) => {
      console.error('Error generating shopping list:', error);
      toast.error('Failed to generate shopping list');
    }
  });
  
  // Check if we should generate a shopping list from the meal plan
  useEffect(() => {
    if (mealPlanId) {
      generateShoppingListMutation.mutate();
    }
  }, [mealPlanId]);
  
  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: (newItem: { name: string, quantity: number, unit: string }) => {
      if (useDummyData) {
        // Add to local dummy data
        const newId = Math.max(...dummyItems.map(item => item.id), 0) + 1;
        const itemToAdd: ShoppingListItem = {
          id: newId,
          name: newItem.name,
          quantity: newItem.quantity,
          unit: newItem.unit,
          aisle: guessAisleFromName(newItem.name),
          isChecked: false
        };
        
        setDummyItems([...dummyItems, itemToAdd]);
        return Promise.resolve({ success: true });
      }
      
      return apiClient.post('/shopping-list', newItem);
    },
    onSuccess: () => {
      toast.success(`Added ${newItemName} to your shopping list`);
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemUnit('');
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
    onError: (error) => {
      console.error('Error adding item:', error);
      toast.error('Failed to add item to shopping list');
    }
  });
  
  // Toggle item mutation
  const toggleItemMutation = useMutation({
    mutationFn: (item: ShoppingListItem) => {
      if (useDummyData) {
        // Update local dummy data
        const updatedItems = dummyItems.map(dItem => 
          dItem.id === item.id 
            ? { ...dItem, isChecked: !dItem.isChecked } 
            : dItem
        );
        setDummyItems(updatedItems);
        return Promise.resolve({ success: true });
      }
      
      return apiClient.put(`/shopping-list/${item.id}`, {
        isChecked: !item.isChecked
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`${!variables.isChecked ? 'Checked off' : 'Unmarked'} ${variables.name}`);
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
    onError: (error) => {
      console.error('Error toggling item:', error);
      toast.error('Failed to update item');
    }
  });
  
  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => {
      if (useDummyData) {
        // Remove from local dummy data
        setDummyItems(dummyItems.filter(item => item.id !== itemId));
        return Promise.resolve({ success: true });
      }
      
      return apiClient.delete(`/shopping-list/${itemId}`);
    },
    onSuccess: (_) => {
      toast.success('Item removed from shopping list');
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  });
  
  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: (item: ShoppingListItem) => {
      if (useDummyData) {
        // Update local dummy data
        const updatedItems = dummyItems.map(dItem => 
          dItem.id === item.id ? item : dItem
        );
        setDummyItems(updatedItems);
        return Promise.resolve({ success: true });
      }
      
      return apiClient.put(`/shopping-list/${item.id}`, item);
    },
    onSuccess: () => {
      toast.success('Item updated successfully');
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  });
  
  // Clear completed items mutation
  const clearCompletedMutation = useMutation({
    mutationFn: () => {
      if (useDummyData) {
        // Remove completed items from local dummy data
        setDummyItems(dummyItems.filter(item => !item.isChecked));
        return Promise.resolve({ success: true });
      }
      
      return apiClient.delete('/shopping-list/completed');
    },
    onSuccess: () => {
      toast.success('Cleared all completed items');
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
    onError: (error) => {
      console.error('Error clearing completed items:', error);
      toast.error('Failed to clear completed items');
    }
  });
  
  // Helper function to guess aisle from item name
  function guessAisleFromName(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (/milk|cheese|yogurt|cream|butter|egg/.test(lowerName)) return "Dairy & Eggs";
    if (/chicken|beef|pork|turkey|fish|shrimp|meat/.test(lowerName)) return "Meat & Seafood";
    if (/apple|banana|orange|lettuce|vegetable|carrot|tomato|potato|onion|garlic|fruit|broccoli|pepper/.test(lowerName)) return "Produce";
    if (/pasta|rice|cereal|flour|sugar|grain|bread/.test(lowerName)) return "Grains";
    if (/oil|vinegar|sauce|condiment|ketchup|mustard|mayonnaise|dressing/.test(lowerName)) return "Condiments";
    if (/cookie|candy|chocolate|snack|chip/.test(lowerName)) return "Snacks";
    if (/juice|soda|water|drink|beverage|coffee|tea/.test(lowerName)) return "Beverages";
    if (/soap|detergent|paper|cleaning/.test(lowerName)) return "Household";
    
    return "Other";
  }
  
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
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    addItemMutation.mutate({
      name: newItemName,
      quantity: parseFloat(newItemQuantity) || 1,
      unit: newItemUnit
    });
  };
  
  // Handle toggling an item's checked status
  const handleToggleItem = (item: ShoppingListItem) => {
    toggleItemMutation.mutate(item);
  };
  
  // Handle deleting an item
  const handleDeleteItem = (item: ShoppingListItem) => {
    deleteItemMutation.mutate(item.id);
  };
  
  // Handle updating an item
  const handleUpdateItem = () => {
    if (!editingItem) return;
    updateItemMutation.mutate(editingItem);
  };
  
  // Handle clearing completed items
  const handleClearCompleted = () => {
    clearCompletedMutation.mutate();
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
  
  // Error state
  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load shopping list</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['shoppingList'] })}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
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
                <Button 
                  onClick={handleAddItem}
                  disabled={addItemMutation.isPending}
                >
                  {addItemMutation.isPending ? 'Adding...' : 'Add to List'}
                </Button>
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
                                disabled={toggleItemMutation.isPending}
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
                                    <Button 
                                      onClick={handleUpdateItem}
                                      disabled={updateItemMutation.isPending}
                                    >
                                      {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteItem(item)}
                                disabled={deleteItemMutation.isPending}
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
                      disabled={clearCompletedMutation.isPending}
                    >
                      {clearCompletedMutation.isPending ? 'Clearing...' : 'Clear All'}
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
                            disabled={toggleItemMutation.isPending}
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
                          disabled={deleteItemMutation.isPending}
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