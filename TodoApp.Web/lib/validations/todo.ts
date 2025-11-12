import { z } from "zod";

export const todoSchema = z.object({
  todoContent: z.string().min(1, "Todo content is required"),
  dueDate: z.string().optional(),
});

export type TodoInput = z.infer<typeof todoSchema>;
