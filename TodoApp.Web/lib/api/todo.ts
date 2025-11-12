import { apiClient } from "@/lib/api-client";
import { TodoInput } from "@/lib/validations/todo";

export interface Todo {
  todoId: number;
  todoContent: string;
  isCompleted: boolean;
  createdAt: string;
  dueDate?: string;
}

export const todoApi = {
  getAll: async (): Promise<Todo[]> => {
    const response = await apiClient.get("/api/todo");
    return response.data;
  },

  getById: async (id: number): Promise<Todo> => {
    const response = await apiClient.get(`/api/todo/${id}`);
    return response.data;
  },

  create: async (data: TodoInput): Promise<Todo> => {
    const response = await apiClient.post("/api/todo", data);
    return response.data;
  },

  update: async (id: number, data: TodoInput): Promise<Todo> => {
    const response = await apiClient.put(`/api/todo/${id}`, {
      todoId: id,
      ...data,
    });
    return response.data;
  },

  toggle: async (id: number): Promise<Todo> => {
    // Body gönderme, backend sadece toggle yapar
    const response = await apiClient.patch(`/api/todo/${id}/toggle`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/todo/${id}`, {
      data: { todoId: id },
    });
  },
};
