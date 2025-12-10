import { Priority, PriorityLabels } from "@/lib/types/priority";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
}

export function PrioritySelector({ value, onChange, className = "" }: PrioritySelectorProps) {
  const displayWithBulb: Record<Priority, string> = {
    [Priority.Low]: `🟡 ${PriorityLabels[Priority.Low]}`,
    [Priority.Medium]: `🟠 ${PriorityLabels[Priority.Medium]}`,
    [Priority.High]: `🔴 ${PriorityLabels[Priority.High]}`,
    [Priority.Urgent]: `🟥 ${PriorityLabels[Priority.Urgent]}`,
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as Priority)}
      className={`px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${className}`}
    >
      {Object.entries(displayWithBulb).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
