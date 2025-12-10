import { Priority, PriorityBorder, PriorityColors, PriorityFill } from "@/lib/types/priority";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`inline-flex w-3 h-3 rounded-full border shadow-sm ${PriorityColors[priority]}`}
        style={{ backgroundColor: PriorityFill[priority], borderColor: PriorityBorder[priority] }}
        aria-label={`Priority ${priority}`}
      />
    </span>
  );
}
