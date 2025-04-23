import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Check, 
  Trash2, 
  Plus, 
  PlusCircle, 
  CornerDownLeft, 
  Loader2, 
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Share,
  MoreHorizontal,
  CheckSquare,
  XCircle,
  Search
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useApiClient } from "../../lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMobile } from "../../hooks/use-mobile";

// Define department categories with icons and colors
const departments = [
  { id: "produce", name: "Produce", color: "green" },
  { id: "dairy", name: "Dairy & Eggs", color: "blue" },
  { id: "meat", name: "Meat & Seafood", color: "red" },
  { id: "bakery", name: "Bakery", color: "yellow" },
  { id: "canned", name: "Canned & Jarred", color: "purple" },
  { id: "dry", name: "Dry Goods & Pasta", color: "orange" },
  { id: "frozen", name: "Frozen", color: "cyan" },
  { id: "beverages", name: "Beverages", color: "indigo" },
  { id: "snacks", name: "Snacks", color: "pink" },
  { id: "condiments", name: "Condiments & Spices", color: "amber" },
  { id: "other", name: "Other", color: "gray" },
];

// Get department by aisle
const getDepartmentByAisle = (aisle: string): string => {
  const aisleLower = aisle.toLowerCase();
  
  if (aisleLower.includes("produce") || aisleLower.includes("vegetables") || aisleLower.includes("fruits")) {
    return "produce";
  } else if (aisleLower.includes("dairy") || aisleLower.includes("cheese") || aisleLower.includes("milk") || aisleLower.includes("yogurt") || aisleLower.includes("eggs")) {
    return "dairy";
  } else if (aisleLower.includes("meat") || aisleLower.includes("seafood") || aisleLower.includes("fish")) {
    return "meat";
  } else if (aisleLower.includes("bakery") || aisleLower.includes("bread")) {
    return "bakery";
  } else if (aisleLower.includes("canned") || aisleLower.includes("jarred")) {
    return "canned";
  } else if (aisleLower.includes("pasta") || aisleLower.includes("rice") || aisleLower.includes("grains") || aisleLower.includes("baking")) {
    return "dry";
  } else if (aisleLower.includes("frozen")) {
    return "frozen";
  } else if (aisleLower.includes("beverages") || aisleLower.includes("drinks") || aisleLower.includes("juices")) {
    return "beverages";
  } else if (aisleLower.includes("snacks") || aisleLower.includes("chips") || aisleLower.includes("nuts")) {
    return "snacks";
  } else if (aisleLower.includes("condiments") || aisleLower.includes("spices") || aisleLower.includes("oils") || aisleLower.includes("sauces")) {
    return "condiments";
  } else {
    return "other";
  }
};

// Shopping list component props
interface ShoppingListProps {
  mealPlanId?: number; // Make it optional to support standalone usage
}

// Shopping list component
export function ShoppingList({ mealPlanId }: ShoppingListProps) {
  const [newItemText, setNewItemText] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(departments.map(d => d.id));
  const [filter, setFilter] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<string[]>(["all"]);
  const [animatedItem, setAnimatedItem] = useState<number | null>(null);
  
  const isMobile = useMobile();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  // Define query to get shopping list items, using mealPlanId if provided
  const { data: shoppingList, isLoading, refetch } = useQuery({
    queryKey: ["shopping-list", mealPlanId],
    queryFn: async () => {
      let response;
      
      // If mealPlanId is provided, get shopping list for that meal plan
      if (mealPlanId) {
        response = await apiClient.getShoppingList(mealPlanId);
        
        // If no items exist yet, generate the shopping list
        if (response.success && (!response.shoppingList || response.shoppingList.length === 0)) {
          console.log("No existing shopping list found, generating new one...");
          response = await apiClient.generateShoppingList(mealPlanId);
        }
      } else {
        // For standalone usage, get the regular shopping list
        response = await apiClient.getShoppingList();
      }
      
      if (!response.success) {
        throw new Error("Failed to load shopping list");
      }
      
      console.log("Shopping list response:", response);
      return response.shoppingList || [];
    },
  });
  
  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.addShoppingListItem({
        name,
        quantity: 1,
        unit: "",
      });
      if (!response.success) {
        throw new Error("Failed to add item");
      }
      return response.item;
    },
    onSuccess: () => {
      setNewItemText("");
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast.success("Item added to shopping list");
    },
    onError: () => {
      toast.error("Failed to add item. Please try again.");
    },
  });
  
  // Toggle item checked mutation
  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, checked }: { id: number; checked: boolean }) => {
      const response = await apiClient.updateShoppingListItem(id, checked);
      if (!response.success) {
        throw new Error("Failed to update item");
      }
      return response.item;
    },
    onSuccess: (_, variables) => {
      setCheckedItems((prev) => ({
        ...prev,
        [variables.id]: variables.checked,
      }));
      
      // Animate the item when checked
      setAnimatedItem(variables.id);
      setTimeout(() => setAnimatedItem(null), 500);
      
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
    onError: () => {
      toast.error("Failed to update item. Please try again.");
    },
  });
  
  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.deleteShoppingListItem(id);
      if (!response.success) {
        throw new Error("Failed to delete item");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast.success("Item removed from shopping list");
    },
    onError: () => {
      toast.error("Failed to delete item. Please try again.");
    },
  });
  
  // Clear checked items mutation
  const clearCheckedMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const promises = ids.map(id => apiClient.deleteShoppingListItem(id));
      const results = await Promise.all(promises);
      const allSuccessful = results.every(r => r.success);
      
      if (!allSuccessful) {
        throw new Error("Failed to clear some items");
      }
      
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast.success("Checked items cleared");
    },
    onError: () => {
      toast.error("Failed to clear checked items. Please try again.");
    }
  });
  
  // Add new item handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addItemMutation.mutate(newItemText.trim());
    }
  };
  
  // Toggle checked status
  const toggleChecked = (id: number, currentStatus: boolean) => {
    toggleItemMutation.mutate({ id, checked: !currentStatus });
  };
  
  // Delete item handler
  const deleteItem = (id: number) => {
    deleteItemMutation.mutate(id);
  };
  
  // Toggle department expansion
  const toggleDepartment = (deptId: string) => {
    setExpandedDepartments(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId) 
        : [...prev, deptId]
    );
  };
  
  // Share shopping list
  const shareList = async () => {
    if (!shoppingList) return;
    
    const listText = shoppingList
      .map(item => `□ ${item.quantity ? `${item.quantity} ${item.unit} ` : ''}${item.name}`)
      .join('\n');
      
    const shareData = {
      title: 'My Shopping List',
      text: `My Shopping List:\n\n${listText}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast.success("Shopping list copied to clipboard!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error("Couldn't share shopping list");
    }
  };
  
  // Clear checked items
  const clearCheckedItems = () => {
    if (!shoppingList) return;
    
    const idsToDelete = shoppingList
      .filter(item => item.checked)
      .map(item => item.id);
      
    if (idsToDelete.length === 0) {
      toast.info("No checked items to clear");
      return;
    }
    
    clearCheckedMutation.mutate(idsToDelete);
  };
  
  // Organize items by department
  const organizeByDepartment = () => {
    if (!shoppingList) return {};
    
    const itemsByDepartment: Record<string, any[]> = {};
    
    departments.forEach(dept => {
      itemsByDepartment[dept.id] = [];
    });
    
    shoppingList.forEach(item => {
      const deptId = item.aisle 
        ? getDepartmentByAisle(item.aisle) 
        : "other";
        
      itemsByDepartment[deptId].push(item);
    });
    
    return itemsByDepartment;
  };
  
  // Filter items based on search
  const filteredItems = () => {
    if (!shoppingList) return {};
    
    const itemsByDepartment = organizeByDepartment();
    
    if (!filter) return itemsByDepartment;
    
    const filtered: Record<string, any[]> = {};
    
    departments.forEach(dept => {
      filtered[dept.id] = itemsByDepartment[dept.id].filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
      );
    });
    
    return filtered;
  };
  
  // Get department color
  const getDepartmentColor = (deptId: string): string => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.color : "gray";
  };
  
  // Count items
  const countItems = {
    total: shoppingList?.length || 0,
    checked: shoppingList?.filter(item => item.checked).length || 0,
    unchecked: shoppingList?.filter(item => !item.checked).length || 0
  };
  
  // Render department items
  const renderDepartmentItems = (deptId: string, items: any[]) => {
    if (items.length === 0) return null;
    
    return (
      <div key={deptId} className="mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer py-2"
          onClick={() => toggleDepartment(deptId)}
        >
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full bg-${getDepartmentColor(deptId)}-500 mr-2`}></div>
            <h3 className="font-medium text-sm">
              {departments.find(d => d.id === deptId)?.name}
            </h3>
            <Badge variant="outline" className="ml-2">
              {items.length}
            </Badge>
          </div>
          {expandedDepartments.includes(deptId) 
            ? <ChevronUp className="h-4 w-4 text-gray-500" /> 
            : <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </div>
        
        {expandedDepartments.includes(deptId) && (
          <ul className="mt-1 space-y-2">
            {items.map(item => (
              <li 
                key={item.id} 
                className={cn(
                  "flex items-center p-2 rounded-lg border-l-4 transition-all",
                  item.checked 
                    ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
                    : "border-transparent hover:border-gray-200 bg-white dark:bg-gray-950",
                  animatedItem === item.id && "animate-pulse"
                )}
              >
                <div 
                  className={`h-5 w-5 rounded-md border cursor-pointer flex items-center justify-center ${
                    item.checked 
                      ? "bg-green-500 border-green-500" 
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => toggleChecked(item.id, item.checked)}
                >
                  {item.checked && <Check className="h-3 w-3 text-white" />}
                </div>
                
                <span 
                  className={`ml-3 flex-1 ${
                    item.checked ? "line-through text-gray-500" : ""
                  }`}
                >
                  {item.quantity ? `${item.quantity} ${item.unit} ` : ""}
                  {item.name}
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white pb-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shopping List
              </CardTitle>
              <CardDescription className="text-white/90 mt-1">
                {countItems.total} items ({countItems.checked} checked)
              </CardDescription>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={shareList}>
                  <Share className="mr-2 h-4 w-4" />
                  Share List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearCheckedItems}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Clear Checked Items
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCheckedItems({})}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Uncheck All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Add item form */}
          <form onSubmit={handleAddItem} className="mt-4 flex">
            <Input
              placeholder="Add item to shopping list..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="rounded-r-none bg-white/20 border-0 text-white placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white"
            />
            <Button 
              type="submit" 
              className="rounded-l-none bg-white text-teal-700 hover:bg-white/90 hover:text-teal-800"
              disabled={!newItemText.trim() || addItemMutation.isPending}
            >
              {addItemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CornerDownLeft className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="p-4">
            <Accordion
              type="single"
              collapsible
              value={activeAccordion[0]}
              onValueChange={(value) => setActiveAccordion(value ? [value] : [])}
              className="w-full"
            >
              <AccordionItem value="all" className="border-none">
                <AccordionTrigger className="py-2 px-0 hover:no-underline">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">All Items</h2>
                    <Badge variant="outline" className="ml-2">
                      {countItems.total}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : shoppingList?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Your shopping list is empty.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add items using the form above.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {Object.entries(filteredItems()).map(([deptId, items]) => 
                        items.length > 0 && renderDepartmentItems(deptId, items)
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Progress bar */}
            {shoppingList && shoppingList.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>{countItems.checked} of {countItems.total} items checked</span>
                  <span>{Math.round((countItems.checked / countItems.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${(countItems.checked / countItems.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}