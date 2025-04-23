import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SearchFiltersProps {
  onChange: (filters: { diet?: string; maxCalories?: number }) => void;
  onApply: () => void;
  initialValues?: {
    diet?: string;
    maxCalories?: number;
  };
}

const SearchFilters = ({ onChange, onApply, initialValues = {} }: SearchFiltersProps) => {
  const [diet, setDiet] = useState(initialValues.diet || '');
  const [maxCalories, setMaxCalories] = useState(initialValues.maxCalories || 1200);

  // Emit changes to parent
  useEffect(() => {
    onChange({
      diet: diet || undefined,
      maxCalories: maxCalories || undefined
    });
  }, [diet, maxCalories, onChange]);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="diet-select">Diet Type</Label>
        <Select
          value={diet}
          onValueChange={setDiet}
        >
          <SelectTrigger id="diet-select" className="w-full mt-1">
            <SelectValue placeholder="Select a diet type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="vegetarian">Vegetarian</SelectItem>
            <SelectItem value="vegan">Vegan</SelectItem>
            <SelectItem value="glutenFree">Gluten Free</SelectItem>
            <SelectItem value="ketogenic">Ketogenic</SelectItem>
            <SelectItem value="paleo">Paleo</SelectItem>
            <SelectItem value="whole30">Whole30</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="flex justify-between">
          <Label htmlFor="calories-slider">Max Calories</Label>
          <span className="text-sm text-muted-foreground">{maxCalories} kcal</span>
        </div>
        <Slider
          id="calories-slider"
          min={100}
          max={2000}
          step={50}
          value={[maxCalories]}
          onValueChange={(values) => setMaxCalories(values[0])}
          className="mt-2"
        />
      </div>
      
      <Button onClick={onApply} className="w-full">Apply Filters</Button>
    </div>
  );
};

export default SearchFilters;