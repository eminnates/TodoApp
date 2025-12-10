import { Category } from "@/lib/types/category";

interface CategorySelectorProps {
  categories: Category[];
  value?: number;
  onChange: (categoryId?: number) => void;
  className?: string;
}

export function CategorySelector({ categories, value, onChange, className = "" }: CategorySelectorProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className={`px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${className}`}
      style={{
        backgroundColor: '#FFFEF9',
        borderColor: '#B5A495',
        color: '#4A4239',
        fontFamily: '\'Courier New\', Courier, monospace',
      }}
    >
      <option value="">No Category</option>
      {categories.map((category) => (
        <option key={category.categoryId} value={category.categoryId}>
          {category.icon ? `${category.icon} ` : ""}{category.name}
        </option>
      ))}
    </select>
  );
}
