import { apiClient } from "@/lib/api-client";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/lib/types/category";

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get("/api/category");
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get(`/api/category/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryInput): Promise<Category> => {
    const response = await apiClient.post("/api/category", data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryInput): Promise<void> => {
    await apiClient.put(`/api/category/${id}`, { ...data, categoryId: id });
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/category/${id}`);
  },
};
