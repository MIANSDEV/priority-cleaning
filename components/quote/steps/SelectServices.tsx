"use client";

import { ServiceCategory, SelectedService } from "@/lib/types";
import ServiceSection from "@/components/quote/ServiceSection";

interface Props {
  categories: ServiceCategory[];
  selected: SelectedService[];
  onUpdate: (updated: SelectedService[]) => void;
}

export default function SelectServices({ categories, selected, onUpdate }: Props) {
  const handleCategoryUpdate = (categoryId: string, newItems: SelectedService[]) => {
    // Remove old items from this category, add new ones
    const filtered = selected.filter((s) => s.category_id !== categoryId);
    onUpdate([...filtered, ...newItems]);
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">What can we clean for you?</h1>
        <p className="text-sm text-gray-500 mt-1">
          Please select all items and services from the drop-downs below for an accurate quote.
          Any discount that may apply will be shown.
        </p>
      </div>

      {categories.map((category) => (
        <ServiceSection
          key={category.id}
          category={category}
          selected={selected.filter((s) => s.category_id === category.id)}
          onUpdate={(updated) => handleCategoryUpdate(category.id, updated)}
        />
      ))}

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Loading services...</p>
        </div>
      )}
    </div>
  );
}
