"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { todoApi, Todo } from "@/lib/api/todo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todoSchema, TodoInput } from "@/lib/validations/todo";

export default function TodosPage() {
  return (
    <AuthGuard>
      <TodosContent />
    </AuthGuard>
  );
}

function TodosContent() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);

  // Tüm todoları getir
  const { data: todos, isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: todoApi.getAll,
  });

  // Todo oluştur
  const createMutation = useMutation({
    mutationFn: todoApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      reset();
    },
  });

  // Todo güncelle
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoInput }) =>
      todoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setEditingId(null);
    },
  });

  // Todo tamamla/tamamlama
  const toggleMutation = useMutation({
    mutationFn: todoApi.toggle,
    onSuccess: (data) => {
      // Backend'den dönen güncellenmiş todo ile cache'i güncelle
      queryClient.setQueryData<Todo[]>(["todos"], (old) => {
        if (!old) return old;
        return old.map((todo) =>
          todo.todoId === data.todoId ? data : todo
        );
      });
    },
  });

  // Todo sil
  const deleteMutation = useMutation({
    mutationFn: todoApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoInput>({
    resolver: zodResolver(todoSchema),
  });

  const onSubmit = (data: TodoInput) => {
    createMutation.mutate(data);
  };

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.todoId);
  };

  const handleUpdate = (id: number, content: string) => {
    updateMutation.mutate({
      id,
      data: { todoContent: content },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Todo App</h1>
              <p className="text-xs text-gray-500">Welcome, {user?.fullName || user?.userName}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Create Todo Form */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Todo
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                {...register("todoContent")}
                type="text"
                placeholder="What do you need to do?"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all text-gray-800 placeholder-gray-400"
              />
              {errors.todoContent && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.todoContent.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <input
                {...register("dueDate")}
                type="datetime-local"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all text-gray-900"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Todos List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Todos
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {todos?.length || 0}
            </span>
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : todos?.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No todos yet</p>
              <p className="text-gray-400 text-sm">Add a new todo above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos?.map((todo) => (
                <div
                  key={todo.todoId}
                  className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    todo.isCompleted 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => toggleMutation.mutate(todo.todoId)}
                    className="w-5 h-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all hover:border-blue-500"
                    title={todo.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  />

                  {editingId === todo.todoId ? (
                    <input
                      type="text"
                      defaultValue={todo.todoContent}
                      placeholder="Todo content..."
                      onBlur={(e) => handleUpdate(todo.todoId, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdate(todo.todoId, e.currentTarget.value);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => handleEdit(todo)}
                      className={`flex-1 cursor-pointer transition-all ${
                        todo.isCompleted
                          ? "line-through text-gray-400"
                          : "text-gray-700 hover:text-blue-600"
                      }`}
                      title="Click to edit"
                    >
                      {todo.todoContent}
                    </span>
                  )}

                  {todo.dueDate && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(todo.dueDate).toLocaleDateString("tr-TR")}
                    </span>
                  )}

                  <button
                    onClick={() => deleteMutation.mutate(todo.todoId)}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Delete"
                  >
                    {deleteMutation.isPending && deleteMutation.variables === todo.todoId ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
