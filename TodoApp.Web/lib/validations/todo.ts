import { z } from "zod";
import { Priority } from "@/lib/types/priority";

export const todoSchema = z.object({
  todoContent: z.string().min(1, "Todo content is required"),
  dueDate: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.Medium),
  categoryId: z.number().positive().optional(),
});

export type TodoInput = z.infer<typeof todoSchema>;
