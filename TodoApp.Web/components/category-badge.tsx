import { Category } from "@/lib/types/category";

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm border-2 bg-white ${className}`}
      style={{
        backgroundColor: `${category.color}10`,
        color: category.color,
        borderColor: category.color,
      }}
    >
      {category.icon && <span>{category.icon}</span>}
      {category.name}
    </span>
  );
}
