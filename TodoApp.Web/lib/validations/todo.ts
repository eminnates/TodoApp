import { z } from "zod";

export const todoSchema = z.object({
  todoContent: z.string().min(1, "Todo içeriği gerekli"),
  dueDate: z.string().optional(),
});

export type TodoInput = z.infer<typeof todoSchema>;
