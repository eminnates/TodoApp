"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { categoryApi } from "@/lib/api/category";
import { CategoryInput, categorySchema } from "@/lib/validations/category";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  });

  const { data: todos } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch("/api/todo", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      reset({ name: "", color: "#3B82F6", icon: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryInput }) =>
      categoryApi.update(id, { categoryId: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      reset({ name: "", color: "#3B82F6", icon: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: "#3B82F6" },
  });

  const onSubmit = (data: CategoryInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  const getCategoryStats = (categoryId: number) => {
    const categoryTodos = todos?.filter((t: any) => t.categoryId === categoryId) || [];
    const completed = categoryTodos.filter((t: any) => t.isCompleted).length;
    const total = categoryTodos.length;
    return { completed, total };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" style={{
        background: 'linear-gradient(to bottom, #FAF8F3 0%, #F5F0E8 50%, #F0EBE0 100%)',
      }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{
            color: '#6B5E52',
            fontFamily: '\'Playfair Display\', serif',
          }}>Organize Sections</h2>
          <button onClick={onClose} className="hover:opacity-70" style={{ color: '#6B5E52' }} aria-label="Close category manager">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-center" style={{ color: '#B5A495' }}>Loading...</p>
          ) : categories?.length === 0 ? (
            <p className="text-center" style={{ color: '#B5A495' }}>No categories yet</p>
          ) : (
            categories?.map((category) => {
              const stats = getCategoryStats(category.categoryId);
              return (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between p-4 rounded-lg border-2 hover:shadow-md transition-all"
                  style={{
                    backgroundColor: '#FFFEF9',
                    borderColor: '#B5A495',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {category.icon && <span className="text-2xl">{category.icon}</span>}
                    <div>
                      <p className="font-medium" style={{
                        color: '#4A4239',
                        fontFamily: '\'Playfair Display\', serif',
                        fontSize: '1.1rem',
                      }}>{category.name}</p>
                      <p className="text-sm" style={{
                        color: '#B5A495',
                        fontFamily: '\'Courier New\', Courier, monospace',
                      }}>
                        {stats.completed}/{stats.total}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(category.categoryId)}
                    className="p-2 rounded-lg transition-all"
                    style={{
                      color: '#A8826B',
                    }}
                    title="Remove category"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
