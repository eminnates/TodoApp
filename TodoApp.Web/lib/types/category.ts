export interface Category {
  categoryId: number;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  todoCount: number;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  categoryId: number;
  name: string;
  color: string;
  icon?: string;
}
