"use client";

import { AuthGuard } from "@/components/auth-guard";
import { CategoryBadge } from "@/components/category-badge";
import { CategoryManager } from "@/components/category-manager";
import { CategorySelector } from "@/components/category-selector";
import { PriorityBadge } from "@/components/priority-badge";
import { categoryApi } from "@/lib/api/category";
import { todoApi, Todo } from "@/lib/api/todo";
import { Priority } from "@/lib/types/priority";
import { todoSchema, TodoInput } from "@/lib/validations/todo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/auth-store";

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
  const [editingContent, setEditingContent] = useState<string>("");
  const [editingDueDate, setEditingDueDate] = useState<string>("");
  const [editingPriority, setEditingPriority] = useState<Priority>(Priority.Medium);
  const [editingCategoryId, setEditingCategoryId] = useState<number | undefined>(undefined);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [editingCategoryHeaderId, setEditingCategoryHeaderId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");

  const categoryPalette = [
    "#6366F1", // indigo-500
    "#22C55E", // green-500
    "#F97316", // orange-500
    "#0EA5E9", // sky-500
    "#EC4899", // pink-500
    "#F59E0B", // amber-500
  ];

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  });

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

  // Kategori güncelle
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => {
      const category = categories?.find((c) => c.categoryId === id);
      if (!category) throw new Error("Category not found");
      return categoryApi.update(id, {
        categoryId: id,
        name,
        color: category.color,
        icon: category.icon,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setEditingCategoryHeaderId(null);
    },
  });

  const groupMutation = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: number; targetId: number }) => {
      if (!todos) throw new Error("Todos are not loaded yet");

      const source = todos.find((todo) => todo.todoId === sourceId);
      const target = todos.find((todo) => todo.todoId === targetId);

      if (!source || !target) throw new Error("Todo not found for grouping");

      const takeTwoWords = (text: string) =>
        text
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .join(" ");

      const newCategory = await categoryApi.create({
        name: `${takeTwoWords(source.todoContent)} + ${takeTwoWords(target.todoContent)}`,
        color: categoryPalette[(sourceId + targetId) % categoryPalette.length],
      });

      const toInput = (todo: Todo): TodoInput => ({
        todoContent: todo.todoContent,
        priority: todo.priority ?? Priority.Medium,
        ...(todo.dueDate ? { dueDate: todo.dueDate } : {}),
        categoryId: newCategory.categoryId,
      });

      await Promise.all([
        todoApi.update(source.todoId, toInput(source)),
        todoApi.update(target.todoId, toInput(target)),
      ]);

      return newCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TodoInput>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      priority: Priority.Medium,
      categoryId: undefined,
    },
  });

  const watchedPriority = watch("priority", Priority.Medium);
  const watchedCategoryId = watch("categoryId");
  const watchedDueDate = watch("dueDate", "");

  const computePriorityFromDueDate = (dueDate?: string): Priority => {
    if (!dueDate) return Priority.Low;
    const due = new Date(dueDate).getTime();
    if (Number.isNaN(due)) return Priority.Low;
    const now = Date.now();
    const diffHours = (due - now) / (1000 * 60 * 60);
    if (diffHours <= 24) return Priority.Urgent;
    if (diffHours <= 72) return Priority.High;
    return Priority.Medium;
  };

  useEffect(() => {
    const autoPriority = computePriorityFromDueDate(watchedDueDate);
    setValue("priority", autoPriority, { shouldValidate: false, shouldDirty: true });
  }, [watchedDueDate, setValue]);

  const onSubmit = (data: TodoInput) => {
    createMutation.mutate(data);
  };

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.todoId);
    setEditingContent(todo.todoContent);
    setEditingDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 16) : "");
    setEditingPriority(todo.priority ?? Priority.Medium);
    setEditingCategoryId(todo.categoryId ?? undefined);
  };

  const handleUpdate = (
    id: number,
    content: string,
    dueDate: string,
    priority: Priority,
    categoryId?: number
  ) => {
    const updateData: TodoInput = { 
      todoContent: content,
      priority,
    };
    if (dueDate) {
      updateData.dueDate = dueDate;
    }
    if (categoryId) {
      updateData.categoryId = categoryId;
    }
    updateMutation.mutate({
      id,
      data: updateData,
    });
  };

  const handleCombineIntoCategory = (sourceId: number, targetId: number) => {
    console.log("handleCombineIntoCategory called", { sourceId, targetId, isPending: groupMutation.isPending });
    if (sourceId === targetId || groupMutation.isPending) return;
    
    // Check if target already has a category
    const targetTodo = todos?.find(t => t.todoId === targetId);
    if (targetTodo?.categoryId) {
      // Assign source todo to target's category instead of creating new one
      const sourceTodo = todos?.find(t => t.todoId === sourceId);
      if (sourceTodo) {
        const updateData: TodoInput = {
          todoContent: sourceTodo.todoContent,
          priority: sourceTodo.priority ?? Priority.Medium,
          categoryId: targetTodo.categoryId,
        };
        if (sourceTodo.dueDate) {
          updateData.dueDate = sourceTodo.dueDate;
        }
        updateMutation.mutate({ id: sourceId, data: updateData });
      }
      return;
    }
    
    console.log("Calling groupMutation.mutate");
    groupMutation.mutate({ sourceId, targetId });
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom, #FAF8F3 0%, #F5F0E8 50%, #F0EBE0 100%)',
      fontFamily: '\'Courier New\', Courier, monospace',
    }}>
      {/* Header - Vintage Notebook Style */}
      <div className="shadow-md border-b-4" style={{
        backgroundColor: '#B5A495',
        borderColor: '#9B8A7C',
        backgroundImage: 'linear-gradient(90deg, rgba(155, 138, 124, 0.1) 0px, transparent 1px), linear-gradient(rgba(155, 138, 124, 0.1) 0px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}>
        <div className="max-w-5xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{
              backgroundColor: '#E5DDD0',
              border: '3px solid #B5A495',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.15)',
            }}>
              <svg className="w-7 h-7" fill="none" stroke="#6B5E52" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{
                color: '#FFFEF9',
                textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
                fontFamily: '\'Playfair Display\', serif',
                letterSpacing: '1px',
              }}>Leaf Note</h1>
              <p className="text-sm" style={{ color: '#E5DDD0' }}>{user?.fullName || user?.userName}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-sm"
            style={{
              backgroundColor: '#D9CFC0',
              color: '#6B5E52',
              border: '2px solid #B5A495',
              fontFamily: '\'Georgia\', serif',
            }}
          >
            Close Book
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Create Todo Form */}
        <div className="p-6 rounded-xl shadow-2xl mb-6 border-4" style={{
          backgroundColor: '#FFFEF9',
          borderColor: '#D9CFC0',
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              rgba(217, 207, 192, 0.15) 31px,
              rgba(217, 207, 192, 0.15) 32px
            ),
            linear-gradient(90deg, rgba(217, 207, 192, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '100% 32px, 40px 100%',
          backgroundPosition: '0 8px, 20px 0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{
            color: '#6B5E52',
            fontFamily: '\'Playfair Display\', serif',
            letterSpacing: '0.5px',
          }}>
            <span style={{ fontSize: '1.5rem' }}>✎</span>
            Write a New Task
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                {...register("todoContent")}
                type="text"
                placeholder="What do you need to do?"
                className="w-full px-4 py-3 border-b-2 focus:outline-none focus:border-b-3 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#B5A495',
                  color: '#4A4239',
                  fontFamily: '\'Niconne\', cursive',
                  fontSize: '1.3rem',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderRadius: 0,
                }}
              />
              {errors.todoContent && (
                <p className="text-sm mt-2 flex items-center gap-1" style={{
                  color: '#A8826B',
                  fontFamily: '\'Courier New\', Courier, monospace',
                  fontStyle: 'italic',
                }}>
                  <span>⚠</span>
                  {errors.todoContent.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <input
                {...register("dueDate")}
                type="datetime-local"
                className="flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none transition-all"
                style={{
                  backgroundColor: '#FFFEF9',
                  borderColor: '#B5A495',
                  color: '#4A4239',
                  fontFamily: '\'Courier New\', Courier, monospace',
                }}
              />
              <CategorySelector
                categories={categories || []}
                value={watchedCategoryId}
                onChange={(value) => setValue("categoryId", value)}
                className="flex-1"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#B5A495',
                  color: '#FFFEF9',
                  border: '3px solid #9B8A7C',
                  fontFamily: '\'Georgia\', serif',
                  letterSpacing: '1px',
                }}
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Writing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ✎ Add Task
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Todos List */}
        <div className="rounded-2xl shadow-2xl p-6 border-4" style={{
          backgroundColor: '#FFFEF9',
          borderColor: '#B5A495',
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              rgba(217, 207, 192, 0.15) 31px,
              rgba(217, 207, 192, 0.15) 32px
            )
          `,
          backgroundSize: '100% 32px',
          backgroundPosition: '0 8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
          <h2 className="text-2xl font-bold mb-5 flex items-center justify-between" style={{
            color: '#6B5E52',
            fontFamily: '\'Playfair Display\', serif',
          }}>
            <span className="flex items-center gap-2">
              My Tasks
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{
              backgroundColor: '#E5DDD0',
              color: '#6B5E52',
              border: '2px solid #B5A495',
              fontFamily: '\'Georgia\', serif',
            }}>
              {todos?.length || 0}
            </span>
          </h2>
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
              style={{
                backgroundColor: '#D9CFC0',
                color: '#6B5E52',
                border: '2px solid #B5A495',
                fontFamily: '\'Georgia\', serif',
              }}
            >
              Organize Sections
            </button>
          </div>

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
              <span style={{ fontSize: '4rem', opacity: 0.3 }}>📝</span>
              <p className="text-lg mt-4" style={{ 
                color: '#B5A495',
                fontFamily: '\'Courier New\', Courier, monospace',
              }}>No tasks yet...</p>
              <p className="text-sm mt-2" style={{ 
                color: '#C4B8A9',
                fontFamily: '\'Georgia\', serif',
                fontStyle: 'italic',
              }}>Start writing above!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Uncategorized Todos */}
              {todos?.filter((todo) => !todo.categoryId).length > 0 && (
                <div className="space-y-2">
                  {todos?.filter((todo) => !todo.categoryId).map((todo) => (
                    <div
                      key={todo.todoId}
                      className={`group relative flex items-center gap-3 p-4 rounded-lg transition-all ${
                        todo.isCompleted 
                          ? 'opacity-60' 
                          : 'hover:shadow-md'
                      } ${
                        draggingId === todo.todoId ? 'ring-2 shadow-lg' : ''
                      } ${
                        dragOverId === todo.todoId && draggingId !== todo.todoId
                          ? 'ring-2 ring-dashed'
                          : ''
                      }`}
                      style={{
                        backgroundColor: '#FFFEF9',
                      }}
                      draggable
                      onDragStart={(e) => {
                        console.log("onDragStart", todo.todoId);
                        setDraggingId(todo.todoId);
                      }}
                      onDragEnd={() => {
                        console.log("onDragEnd");
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      onDragOver={(e) => {
                        if (!draggingId || draggingId === todo.todoId) return;
                        e.preventDefault();
                        console.log("onDragOver", { draggingId, targetId: todo.todoId });
                        setDragOverId(todo.todoId);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        console.log("onDrop", { draggingId, targetId: todo.todoId });
                        if (!draggingId || draggingId === todo.todoId) return;
                        handleCombineIntoCategory(draggingId, todo.todoId);
                        setDragOverId(null);
                        setDraggingId(null);
                      }}
                      title="Drag onto another todo to auto-create a category"
                    >
                      <input
                        type="checkbox"
                        checked={todo.isCompleted}
                        onChange={() => toggleMutation.mutate(todo.todoId)}
                        className="w-5 h-5 rounded-sm cursor-pointer transition-all"
                        style={{
                          accentColor: '#8B7355',
                          border: '2px solid #8B7355',
                          position: 'relative',
                          zIndex: 1,
                        }}
                        title={todo.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                      />

                      {editingId === todo.todoId ? (
                        <div className="flex-1 flex flex-wrap items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>
                          <input
                            type="text"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            placeholder="Todo content..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId);
                              }
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="flex-1 min-w-[180px] px-3 py-2 border-2 rounded-lg focus:outline-none"
                            style={{
                              borderColor: '#B5A495',
                              backgroundColor: '#FFFEF9',
                              color: '#4A4239',
                              fontFamily: '\'Courier New\', Courier, monospace',
                            }}
                          />
                          <input
                            type="datetime-local"
                            value={editingDueDate}
                            onChange={(e) => setEditingDueDate(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId);
                              }
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="px-3 py-2 border-2 rounded-lg focus:outline-none"
                            style={{
                              borderColor: '#B5A495',
                              backgroundColor: '#FFFEF9',
                              color: '#4A4239',
                              fontFamily: '\'Courier New\', Courier, monospace',
                            }}
                          />
                          <CategorySelector
                            categories={categories || []}
                            value={editingCategoryId}
                            onChange={setEditingCategoryId}
                            className="min-w-[160px]"
                          />
                          <button
                            onClick={() => handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId)}
                            className="px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
                            style={{
                              backgroundColor: '#B5A495',
                              color: '#FFFEF9',
                              border: '2px solid #9B8A7C',
                              fontFamily: '\'Georgia\', serif',
                            }}
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
                            style={{
                              backgroundColor: '#D9CFC0',
                              color: '#6B5E52',
                              border: '2px solid #B5A495',
                              fontFamily: '\'Georgia\', serif',
                            }}
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1" style={{ position: 'relative' }}>
                          <span
                            onClick={() => handleEdit(todo)}
                            className={`cursor-pointer transition-all block ${
                              todo.isCompleted
                                ? "line-through"
                                : ""
                            }`}
                            style={{
                              color: todo.isCompleted ? '#B5A99D' : '#4A4239',
                              fontFamily: '\'Niconne\', cursive',
                              fontSize: '1.4rem',
                            }}
                            title="Click to edit"
                          >
                            {todo.todoContent}
                          </span>
                          {/* SVG Pen Stroke Under Text */}
                          <svg
                            className="w-full"
                            style={{ height: '12px', marginTop: '-4px' }}
                            viewBox="0 0 200 12"
                            preserveAspectRatio="none"
                          >
                            {todo.priority === 'Urgent' ? (
                              <>
                                <path d="M 2,3 Q 40,2 80,3 T 160,3 Q 180,3.5 198,3" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
                                <path d="M 1,6 Q 50,5 100,6 T 190,6 Q 195,6.5 199,6" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
                                <path d="M 2,9 Q 60,8 120,9 T 185,9 Q 192,9.5 198,9" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
                              </>
                            ) : todo.priority === 'High' ? (
                              <>
                                <path d="M 2,4 Q 50,3 100,4 T 190,4 Q 195,4.5 198,4" stroke="#EA580C" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
                                <path d="M 1,8 Q 60,7 120,8 T 185,8" stroke="#EA580C" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
                              </>
                            ) : todo.priority === 'Medium' ? (
                              <path d="M 2,6 Q 60,5 120,6 T 198,6" stroke="#EAB308" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
                            ) : (
                              <path d="M 2,6 Q 100,5 198,6" stroke="#D1D5DB" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
                            )}
                          </svg>
                        </div>
                      )}

                      <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>
                        <PriorityBadge priority={todo.priority} />
                      </div>

                      {todo.dueDate && (
                        <span className="text-sm flex items-center gap-1" style={{
                          color: '#B5A495',
                          fontFamily: '\'Courier New\', Courier, monospace',
                          position: 'relative',
                          zIndex: 1,
                        }}>
                          {new Date(todo.dueDate).toLocaleDateString("tr-TR")}
                        </span>
                      )}

                      <button
                        onClick={() => deleteMutation.mutate(todo.todoId)}
                        disabled={deleteMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg disabled:opacity-50"
                        style={{
                          color: '#A8826B',
                          position: 'relative',
                          zIndex: 1,
                        }}
                        title="Delete"
                      >
                        {deleteMutation.isPending && deleteMutation.variables === todo.todoId ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Categorized Todos */}
              {categories?.filter((cat) => todos?.some((t) => t.categoryId === cat.categoryId)).map((category) => (
                <div key={category.categoryId} className="space-y-2 mb-6">
                  {/* Category Header - Simple Bold Title */}
                  {editingCategoryHeaderId === category.categoryId ? (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateCategoryMutation.mutate({
                              id: category.categoryId,
                              name: editingCategoryName,
                            });
                          }
                          if (e.key === "Escape") setEditingCategoryHeaderId(null);
                        }}
                        className="flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none text-lg font-bold"
                        style={{
                          borderColor: '#6B5E52',
                          color: '#6B5E52',
                          fontFamily: '\'Playfair Display\', serif',
                          backgroundColor: '#FFFEF9',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => updateCategoryMutation.mutate({
                          id: category.categoryId,
                          name: editingCategoryName,
                        })}
                        className="px-3 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        style={{
                          backgroundColor: '#B5A495',
                          color: '#FFFEF9',
                          border: '2px solid #9B8A7C',
                          fontFamily: '\'Georgia\', serif',
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingCategoryHeaderId(null)}
                        className="px-3 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        style={{
                          backgroundColor: '#D9CFC0',
                          color: '#6B5E52',
                          border: '2px solid #B5A495',
                          fontFamily: '\'Georgia\', serif',
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <h3 
                      className="font-bold text-xl flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity mb-3 pb-2 border-b-2"
                      style={{
                        color: '#6B5E52',
                        borderColor: '#6B5E52',
                        fontFamily: '\'Playfair Display\', serif',
                      }}
                      onClick={() => {
                        setEditingCategoryHeaderId(category.categoryId);
                        setEditingCategoryName(category.name);
                      }}
                      title="Click to edit category name"
                    >
                      {category.icon && <span className="text-2xl">{category.icon}</span>}
                      {category.name}
                    </h3>
                  )}

                  {/* Category Todos - Simple List */}
                  <div className="space-y-1 pl-4">
                    {todos?.filter((todo) => todo.categoryId === category.categoryId).map((todo) => (
                <div
                  key={todo.todoId}
                  className={`group relative flex items-center gap-2 py-2 px-3 rounded-lg transition-all ${
                    todo.isCompleted 
                      ? 'opacity-60' 
                      : ''
                  } ${
                    draggingId === todo.todoId ? 'opacity-50' : ''
                  } ${
                    dragOverId === todo.todoId && draggingId !== todo.todoId
                      ? 'bg-opacity-20'
                      : ''
                  }`}
                  style={{
                    backgroundColor: '#FFFEF9',
                    cursor: 'grab',
                  }}
                  draggable
                  onDragStart={(e) => {
                    console.log("onDragStart", todo.todoId);
                    setDraggingId(todo.todoId);
                  }}
                  onDragEnd={() => {
                    console.log("onDragEnd");
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onDragOver={(e) => {
                    if (!draggingId || draggingId === todo.todoId) return;
                    e.preventDefault();
                    console.log("onDragOver", { draggingId, targetId: todo.todoId });
                    setDragOverId(todo.todoId);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    console.log("onDrop", { draggingId, targetId: todo.todoId });
                    if (!draggingId || draggingId === todo.todoId) return;
                    handleCombineIntoCategory(draggingId, todo.todoId);
                    setDragOverId(null);
                    setDraggingId(null);
                  }}
                  title="Drag onto another todo to auto-create a category"
                >
                  <span className="text-2xl" style={{ color: '#6B5E52', marginRight: '8px', minWidth: '20px', position: 'relative', zIndex: 1 }}>–</span>
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => toggleMutation.mutate(todo.todoId)}
                    className="w-5 h-5 rounded-sm cursor-pointer transition-all"
                    style={{
                      accentColor: '#B5A495',
                      border: '2px solid #B5A495',
                      position: 'relative',
                      zIndex: 1,
                    }}
                    title={todo.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  />

                  {editingId === todo.todoId ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        placeholder="Todo content..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 min-w-[180px] px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        style={{
                          fontFamily: '\'Niconne\', cursive',
                          fontSize: '1.3rem',
                        }}
                      />
                      <input
                        type="datetime-local"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                      <CategorySelector
                        categories={categories || []}
                        value={editingCategoryId}
                        onChange={setEditingCategoryId}
                        className="min-w-[160px]"
                      />
                      <button
                        onClick={() => handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1" style={{ position: 'relative' }}>
                      <span
                        onClick={() => handleEdit(todo)}
                        className={`cursor-pointer transition-all block ${
                          todo.isCompleted
                            ? "line-through text-gray-400"
                            : "text-gray-700 hover:text-blue-600"
                        }`}
                        style={{
                          fontFamily: '\'Niconne\', cursive',
                          fontSize: '1.4rem',
                        }}
                        title="Click to edit"
                      >
                        {todo.todoContent}
                      </span>
                      {/* SVG Pen Stroke Under Text */}
                      <svg
                        className="w-full"
                        style={{ height: '10px', marginTop: '-3px' }}
                        viewBox="0 0 200 10"
                        preserveAspectRatio="none"
                      >
                        {todo.priority === 'Urgent' ? (
                          <>
                            <path d="M 2,2 Q 40,1.5 80,2 T 160,2 Q 180,2.3 198,2" stroke="#DC2626" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
                            <path d="M 1,5 Q 50,4.5 100,5 T 190,5 Q 195,5.3 199,5" stroke="#DC2626" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
                            <path d="M 2,8 Q 60,7.5 120,8 T 185,8 Q 192,8.3 198,8" stroke="#DC2626" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
                          </>
                        ) : todo.priority === 'High' ? (
                          <>
                            <path d="M 2,3 Q 50,2.5 100,3 T 190,3 Q 195,3.3 198,3" stroke="#EA580C" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8" />
                            <path d="M 1,7 Q 60,6.5 120,7 T 185,7" stroke="#EA580C" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8" />
                          </>
                        ) : todo.priority === 'Medium' ? (
                          <path d="M 2,5 Q 60,4.5 120,5 T 198,5" stroke="#EAB308" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8" />
                        ) : (
                          <path d="M 2,5 Q 100,4.5 198,5" stroke="#D1D5DB" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
                        )}
                      </svg>
                    </div>
                  )}

                  <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>
                    <PriorityBadge priority={todo.priority} />
                  </div>

                  {todo.dueDate && (
                    <span className="text-sm text-gray-500 flex items-center gap-1" style={{ position: 'relative', zIndex: 1 }}>
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
                    style={{ position: 'relative', zIndex: 1 }}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <CategoryManager isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
    </div>
  );
}
