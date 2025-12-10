"use client";

import { AuthGuard } from "@/components/auth-guard";
import { CategoryManager } from "@/components/category-manager";
import { CategorySelector } from "@/components/category-selector";
import { categoryApi } from "@/lib/api/category";
import { todoApi, Todo } from "@/lib/api/todo";
import { Priority } from "@/lib/types/priority";
import { todoSchema, TodoInput } from "@/lib/validations/todo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
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
  
  // Input genişliğini içeriğe göre ayarlamak için ref
  const editInputRef = useRef<HTMLInputElement>(null);

  const categoryPalette = [
    "#6366F1", "#22C55E", "#F97316", "#0EA5E9", "#EC4899", "#F59E0B"
  ];

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoryApi.getAll });
  const { data: todos, isLoading } = useQuery({ queryKey: ["todos"], queryFn: todoApi.getAll });

  const createMutation = useMutation({
    mutationFn: todoApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["todos"] }); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoInput }) => todoApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["todos"] }); setEditingId(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: todoApi.toggle,
    onSuccess: (data) => {
      queryClient.setQueryData<Todo[]>(["todos"], (old) => old ? old.map((t) => t.todoId === data.todoId ? data : t) : old);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: todoApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["todos"] }); },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => {
      const category = categories?.find((c) => c.categoryId === id);
      if (!category) throw new Error("Category not found");
      return categoryApi.update(id, { categoryId: id, name, color: category.color, icon: category.icon });
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
      const source = todos.find((t) => t.todoId === sourceId);
      const target = todos.find((t) => t.todoId === targetId);
      if (!source || !target) throw new Error("Todo not found");

      const takeTwoWords = (text: string) => text.trim().split(/\s+/).slice(0, 2).join(" ");
      const newCategory = await categoryApi.create({
        name: `${takeTwoWords(source.todoContent)} + ${takeTwoWords(target.todoContent)}`,
        color: categoryPalette[(sourceId + targetId) % categoryPalette.length],
      });

      const toInput = (t: Todo): TodoInput => ({
        todoContent: t.todoContent,
        priority: t.priority ?? Priority.Medium,
        ...(t.dueDate ? { dueDate: t.dueDate } : {}),
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TodoInput>({
    resolver: zodResolver(todoSchema),
    defaultValues: { priority: Priority.Medium, categoryId: undefined },
  });

  const watchedDueDate = watch("dueDate", "");

  useEffect(() => {
    if (!watchedDueDate) { setValue("priority", Priority.Low); return; }
    const due = new Date(watchedDueDate).getTime();
    const now = Date.now();
    const diffHours = (due - now) / (1000 * 60 * 60);
    if (diffHours <= 24) setValue("priority", Priority.Urgent);
    else if (diffHours <= 72) setValue("priority", Priority.High);
    else setValue("priority", Priority.Medium);
  }, [watchedDueDate, setValue]);

  const onSubmit = (data: TodoInput) => createMutation.mutate(data);

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.todoId);
    setEditingContent(todo.todoContent);
    setEditingDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 16) : "");
    setEditingPriority(todo.priority ?? Priority.Medium);
    setEditingCategoryId(todo.categoryId ?? undefined);
    // Edit moduna geçince inputa odaklan
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const handleUpdate = (id: number, content: string, dueDate: string, priority: Priority, categoryId?: number) => {
    const updateData: TodoInput = { todoContent: content, priority };
    if (dueDate) updateData.dueDate = dueDate;
    if (categoryId) updateData.categoryId = categoryId;
    updateMutation.mutate({ id, data: updateData });
  };

  const handleCombineIntoCategory = (sourceId: number, targetId: number) => {
    if (sourceId === targetId || groupMutation.isPending) return;
    const targetTodo = todos?.find(t => t.todoId === targetId);
    if (targetTodo?.categoryId) {
      const sourceTodo = todos?.find(t => t.todoId === sourceId);
      if (sourceTodo) {
        const updateData: TodoInput = {
          todoContent: sourceTodo.todoContent,
          priority: sourceTodo.priority ?? Priority.Medium,
          categoryId: targetTodo.categoryId,
        };
        if (sourceTodo.dueDate) updateData.dueDate = sourceTodo.dueDate;
        updateMutation.mutate({ id: sourceId, data: updateData });
      }
      return;
    }
    groupMutation.mutate({ sourceId, targetId });
  };

  // Reusable component for the wavy underline SVG
  const WavyUnderline = ({ priority }: { priority: Priority }) => (
    <svg style={{ width: '100%', height: '12px', marginTop: '-6px', overflow: 'visible', display: 'block' }} viewBox="0 0 100 12" preserveAspectRatio="none">
      {priority === Priority.Urgent ? (
        <>
          <path d="M 0,4 Q 25,2 50,4 T 100,4" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" filter="url(#hand-drawn-filter)" vectorEffect="non-scaling-stroke" />
          <path d="M 0,8 Q 25,10 50,8 T 100,8" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" filter="url(#hand-drawn-filter)" vectorEffect="non-scaling-stroke" />
        </>
      ) : priority === Priority.High ? (
        <>
          <path d="M 0,5 Q 25,3 50,5 T 100,5" stroke="#EA580C" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" filter="url(#hand-drawn-filter)" vectorEffect="non-scaling-stroke" />
          <path d="M 5,9 Q 30,11 55,9 T 95,9" stroke="#EA580C" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" filter="url(#hand-drawn-filter)" vectorEffect="non-scaling-stroke" />
        </>
      ) : priority === Priority.Medium ? (
        <path d="M 0,6 Q 25,4 50,6 T 100,6" stroke="#EAB308" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" filter="url(#hand-drawn-filter)" vectorEffect="non-scaling-stroke" />
      ) : (
        <path d="M 0,6 Q 25,5 50,6 T 100,6" stroke="#D1D5DB" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" filter="url(#hand-drawn-filter)" vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom, #FAF8F3 0%, #F5F0E8 50%, #F0EBE0 100%)',
      fontFamily: '\'Courier New\', Courier, monospace',
    }}>
      {/* GÖRÜNMEZ FİLTRE (Titrek Çizgi İçin) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="hand-drawn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
        </defs>
      </svg>

      {/* Header */}
      <div className="shadow-md border-b-4" style={{
        backgroundColor: '#B5A495',
        borderColor: '#9B8A7C',
        backgroundImage: 'linear-gradient(90deg, rgba(155, 138, 124, 0.1) 0px, transparent 1px), linear-gradient(rgba(155, 138, 124, 0.1) 0px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}>
        <div className="max-w-5xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{
              backgroundColor: '#E5DDD0', border: '3px solid #B5A495', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.15)',
            }}>
              <svg className="w-7 h-7" fill="none" stroke="#6B5E52" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{
                color: '#FFFEF9', textShadow: '1px 1px 3px rgba(0,0,0,0.3)', fontFamily: '\'Playfair Display\', serif', letterSpacing: '1px',
              }}>Leaf Note</h1>
              <p className="text-sm" style={{ color: '#E5DDD0' }}>{user?.fullName || user?.userName}</p>
            </div>
          </div>
          <button onClick={() => logout()} className="px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-sm"
            style={{ backgroundColor: '#D9CFC0', color: '#6B5E52', border: '2px solid #B5A495', fontFamily: '\'Georgia\', serif' }}>
            Close Book
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Create Todo Form */}
        <div className="p-6 rounded-xl shadow-2xl mb-6 border-4" style={{
          backgroundColor: '#FFFEF9', borderColor: '#D9CFC0',
          backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(217, 207, 192, 0.15) 31px, rgba(217, 207, 192, 0.15) 32px), linear-gradient(90deg, rgba(217, 207, 192, 0.25) 1px, transparent 1px)`,
          backgroundSize: '100% 32px, 40px 100%', backgroundPosition: '0 8px, 20px 0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#6B5E52', fontFamily: '\'Playfair Display\', serif' }}>
            <span style={{ fontSize: '1.5rem' }}>✎</span> Write a New Task
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                {...register("todoContent")}
                type="text"
                placeholder="What do you need to do?"
                className="w-full px-4 py-3 border-b-2 focus:outline-none focus:border-b-3 transition-all"
                style={{
                  backgroundColor: 'transparent', borderColor: '#B5A495', color: '#4A4239',
                  fontFamily: '\'Niconne\', cursive', fontSize: '1.3rem',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0,
                }}
              />
              {errors.todoContent && (
                <p className="text-sm mt-2 flex items-center gap-1" style={{ color: '#A8826B', fontStyle: 'italic', fontFamily: '\'Courier New\'' }}>
                  <span>⚠</span> {errors.todoContent.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <input
                {...register("dueDate")}
                type="datetime-local"
                className="flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none transition-all"
                style={{ backgroundColor: '#FFFEF9', borderColor: '#B5A495', color: '#4A4239', fontFamily: '\'Courier New\'' }}
              />
              <CategorySelector categories={categories || []} value={watch("categoryId")} onChange={(v) => setValue("categoryId", v)} className="flex-1" />
              <button type="submit" disabled={createMutation.isPending} className="px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: '#B5A495', color: '#FFFEF9', border: '3px solid #9B8A7C', fontFamily: '\'Georgia\', serif' }}>
                {createMutation.isPending ? "Writing..." : "✎ Add Task"}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="rounded-2xl shadow-2xl p-6 border-4" style={{
          backgroundColor: '#FFFEF9', borderColor: '#B5A495',
          backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(217, 207, 192, 0.15) 31px, rgba(217, 207, 192, 0.15) 32px)`,
          backgroundSize: '100% 32px', backgroundPosition: '0 8px',
        }}>
          <h2 className="text-2xl font-bold mb-5 flex items-center justify-between" style={{ color: '#6B5E52', fontFamily: '\'Playfair Display\', serif' }}>
            <span>My Tasks</span>
            <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#E5DDD0', color: '#6B5E52', border: '2px solid #B5A495' }}>{todos?.length || 0}</span>
          </h2>
          <div className="flex justify-end mb-4">
            <button onClick={() => setCategoryModalOpen(true)} className="px-4 py-2 text-sm font-medium rounded-lg shadow-md hover:shadow-lg"
              style={{ backgroundColor: '#D9CFC0', color: '#6B5E52', border: '2px solid #B5A495', fontFamily: '\'Georgia\'' }}>
              Organize Sections
            </button>
          </div>

          {isLoading ? <div className="text-center py-12">Loading...</div> : todos?.length === 0 ? <div className="text-center py-12 text-gray-400">No tasks yet...</div> : (
            <div className="space-y-6">
              
              {/* Uncategorized Todos */}
              {(todos?.filter((t) => !t.categoryId).length ?? 0) > 0 && (
                <div className="space-y-2">
                  {todos?.filter((t) => !t.categoryId).map((todo) => (
                    <div key={todo.todoId} className={`group relative flex items-center gap-3 p-4 rounded-lg transition-all ${todo.isCompleted ? 'opacity-60' : 'hover:shadow-md'} ${draggingId === todo.todoId ? 'ring-2 shadow-lg' : ''}`}
                      style={{ backgroundColor: '#FFFEF9' }} draggable onDragStart={() => setDraggingId(todo.todoId)} onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                      onDragOver={(e) => { if (!draggingId || draggingId === todo.todoId) return; e.preventDefault(); setDragOverId(todo.todoId); }}
                      onDrop={(e) => { e.preventDefault(); if (!draggingId || draggingId === todo.todoId) return; handleCombineIntoCategory(draggingId, todo.todoId); setDragOverId(null); setDraggingId(null); }}
                    >
                      <input type="checkbox" checked={todo.isCompleted} onChange={() => toggleMutation.mutate(todo.todoId)} className="w-5 h-5 rounded-sm cursor-pointer" style={{ accentColor: '#8B7355', border: '2px solid #8B7355', zIndex: 1 }} />

                      {editingId === todo.todoId ? (
                        /* EDIT MODE: Niconne Font & Transparent Background */
                        <div className="flex-1 flex flex-wrap items-center gap-2" style={{ zIndex: 1 }}>
                          <input 
                            ref={editInputRef}
                            type="text" 
                            value={editingContent} 
                            onChange={(e) => setEditingContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId); }}
                            className="flex-1 min-w-[200px] bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                            style={{ 
                              color: '#4A4239', 
                              fontFamily: '\'Niconne\', cursive', 
                              fontSize: '1.4rem',
                              borderBottom: '1px dashed #B5A495' // Yazarken rehber olması için çok hafif bir alt çizgi
                            }}
                          />
                          <input type="datetime-local" value={editingDueDate} onChange={(e) => setEditingDueDate(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                            style={{ backgroundColor: 'transparent', borderColor: '#B5A495', color: '#4A4239', fontFamily: '\'Courier New\'' }}
                          />
                          <CategorySelector categories={categories || []} value={editingCategoryId} onChange={setEditingCategoryId} className="min-w-[140px]" />
                          <button onClick={() => handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId)}
                            className="px-3 py-1 rounded text-sm font-bold shadow-sm" style={{ backgroundColor: '#B5A495', color: '#FFFEF9' }}>✓</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-sm font-bold shadow-sm" style={{ backgroundColor: '#D9CFC0', color: '#6B5E52' }}>✗</button>
                        </div>
                      ) : (
                        /* VIEW MODE: Wavy Underline Matches Text Width */
                        <div className="flex-1" style={{ position: 'relative', width: 'fit-content' }}>
                          <div style={{ display: 'inline-block', position: 'relative' }}>
                            <span onClick={() => handleEdit(todo)} className={`cursor-pointer block ${todo.isCompleted ? "line-through" : ""}`} style={{ color: todo.isCompleted ? '#B5A99D' : '#4A4239', fontFamily: '\'Niconne\', cursive', fontSize: '1.4rem' }}>{todo.todoContent}</span>
                            <WavyUnderline priority={todo.priority ?? Priority.Medium} />
                          </div>
                        </div>
                      )}
                      
                      {todo.dueDate && <span className="text-sm flex items-center gap-1" style={{ color: '#B5A495', fontFamily: '\'Courier New\'', zIndex: 1 }}>{new Date(todo.dueDate).toLocaleDateString("tr-TR")}</span>}
                      <button onClick={() => deleteMutation.mutate(todo.todoId)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500" style={{ zIndex: 1 }}>🗑</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Categorized Todos */}
              {categories?.filter((cat) => todos?.some((t) => t.categoryId === cat.categoryId)).map((category) => (
                <div key={category.categoryId} className="space-y-2 mb-6">
                  {editingCategoryHeaderId === category.categoryId ? (
                    <div className="flex items-center gap-2 mb-3">
                      <input type="text" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") updateCategoryMutation.mutate({ id: category.categoryId, name: editingCategoryName }); }}
                        className="flex-1 px-3 py-2 border-2 rounded-lg font-bold" autoFocus style={{ borderColor: '#6B5E52', color: '#6B5E52', fontFamily: '\'Playfair Display\'' }} />
                      <button onClick={() => updateCategoryMutation.mutate({ id: category.categoryId, name: editingCategoryName })}>✓</button>
                      <button onClick={() => setEditingCategoryHeaderId(null)}>✗</button>
                    </div>
                  ) : (
                    <h3 className="font-bold text-xl flex items-center gap-2 cursor-pointer mb-3 pb-2 border-b-2" style={{ color: '#6B5E52', borderColor: '#6B5E52', fontFamily: '\'Playfair Display\', serif' }}
                      onClick={() => { setEditingCategoryHeaderId(category.categoryId); setEditingCategoryName(category.name); }}>
                      {category.icon && <span className="text-2xl">{category.icon}</span>} {category.name}
                    </h3>
                  )}

                  <div className="space-y-1 pl-4">
                    {todos?.filter((t) => t.categoryId === category.categoryId).map((todo) => (
                      <div key={todo.todoId} className={`group relative flex items-center gap-2 py-2 px-3 rounded-lg transition-all ${todo.isCompleted ? 'opacity-60' : ''}`}
                        style={{ backgroundColor: '#FFFEF9' }} draggable onDragStart={() => setDraggingId(todo.todoId)} onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                        onDrop={(e) => { e.preventDefault(); if (!draggingId || draggingId === todo.todoId) return; handleCombineIntoCategory(draggingId, todo.todoId); setDragOverId(null); setDraggingId(null); }}
                      >
                        <span className="text-2xl" style={{ color: '#6B5E52', marginRight: '8px', zIndex: 1 }}>–</span>
                        <input type="checkbox" checked={todo.isCompleted} onChange={() => toggleMutation.mutate(todo.todoId)} className="w-5 h-5 rounded-sm" style={{ accentColor: '#B5A495', border: '2px solid #B5A495', zIndex: 1 }} />

                        {editingId === todo.todoId ? (
                          /* EDIT MODE (Categorized): Niconne Font & Transparent Background */
                          <div className="flex-1 flex flex-wrap items-center gap-2" style={{ zIndex: 1 }}>
                            <input 
                              ref={editInputRef}
                              type="text" 
                              value={editingContent} 
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId); }}
                              className="flex-1 min-w-[200px] bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                              style={{ 
                                color: '#4A4239', 
                                fontFamily: '\'Niconne\', cursive', 
                                fontSize: '1.4rem',
                                borderBottom: '1px dashed #B5A495'
                              }}
                            />
                            <button onClick={() => handleUpdate(todo.todoId, editingContent, editingDueDate, editingPriority, editingCategoryId)}
                              className="px-3 py-1 rounded text-sm font-bold shadow-sm" style={{ backgroundColor: '#B5A495', color: '#FFFEF9' }}>✓</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-sm font-bold shadow-sm" style={{ backgroundColor: '#D9CFC0', color: '#6B5E52' }}>✗</button>
                          </div>
                        ) : (
                          /* VIEW MODE (Categorized): Wavy Underline Matches Text Width */
                          <div className="flex-1" style={{ position: 'relative', width: 'fit-content' }}>
                             <div style={{ display: 'inline-block', position: 'relative' }}>
                                <span onClick={() => handleEdit(todo)} className={`cursor-pointer block ${todo.isCompleted ? "line-through text-gray-400" : "text-gray-700"}`} style={{ fontFamily: '\'Niconne\', cursive', fontSize: '1.4rem' }}>{todo.todoContent}</span>
                                <WavyUnderline priority={todo.priority ?? Priority.Medium} />
                             </div>
                          </div>
                        )}
                        {todo.dueDate && <span className="text-sm text-gray-500" style={{ zIndex: 1 }}>{new Date(todo.dueDate).toLocaleDateString("tr-TR")}</span>}
                        <button onClick={() => deleteMutation.mutate(todo.todoId)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500" style={{ zIndex: 1 }}>🗑</button>
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