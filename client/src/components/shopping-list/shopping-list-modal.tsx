import { useState } from 'react';
import { ShoppingList } from './shopping-list';
import { X } from 'lucide-react';

interface ShoppingListModalProps {
  mealPlanId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ShoppingListModal({ mealPlanId, isOpen, onClose }: ShoppingListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Shopping List</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <ShoppingList mealPlanId={mealPlanId} />
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}