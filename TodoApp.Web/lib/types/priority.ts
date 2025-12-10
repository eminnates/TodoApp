export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export const PriorityLabels: Record<Priority, string> = {
  [Priority.Low]: "Low",
  [Priority.Medium]: "Medium",
  [Priority.High]: "High",
  [Priority.Urgent]: "Urgent",
};

export const PriorityColors: Record<Priority, string> = {
  [Priority.Low]: "bg-yellow-300 border-yellow-400",
  [Priority.Medium]: "bg-orange-400 border-orange-500",
  [Priority.High]: "bg-red-500 border-red-600",
  [Priority.Urgent]: "bg-red-700 border-red-800",
};

export const PriorityFill: Record<Priority, string> = {
  [Priority.Low]: "#FDE047",    // yellow-300
  [Priority.Medium]: "#FB923C", // orange-400
  [Priority.High]: "#EF4444",   // red-500
  [Priority.Urgent]: "#B91C1C", // red-700
};

export const PriorityBorder: Record<Priority, string> = {
  [Priority.Low]: "#FACC15",     // yellow-400
  [Priority.Medium]: "#F97316",  // orange-500
  [Priority.High]: "#DC2626",    // red-600
  [Priority.Urgent]: "#991B1B",  // red-800
};
