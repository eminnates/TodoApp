using Microsoft.EntityFrameworkCore;
using TodoApp.API.Models.Entities;
using TodoApp.API.Data;

namespace TodoApp.API.Data.Repositories
{
    public class TodoRepository : ITodoRepository
    {
        private readonly DbContext _context;
        private readonly DbSet<Todo> dbSet;

        public TodoRepository(DbContext context)
        {
            _context = context;
            this.dbSet = _context.Set<Todo>();
        }

        public async Task<bool> CreateTodoAsync(Todo todo)
        {

            await dbSet.AddAsync(todo);
            var created = await _context.SaveChangesAsync();
            return created > 0;
        }

        public async Task<bool> DeleteTodoAsync(int todoId)
        {
            var todo = await dbSet.FirstOrDefaultAsync(t => t.TodoId == todoId);
            if (todo == null)
                throw new Exception($"Todo with id {todoId} not found");
            todo.IsDeleted = true;
            return await _context.SaveChangesAsync() > 0;

        }

        public async Task<List<Todo>> GetAllTodosAsync()
        {
            List<Todo> todos = await dbSet.Where(t => !t.IsDeleted).AsNoTracking().ToListAsync();
            return todos;
        }

        public async Task<Todo> GetTodoByIdAsync(int todoId)
        {
            // AsNoTracking kullan, her seferinde fresh entity dönsün
            var todo = await dbSet.AsNoTracking().FirstOrDefaultAsync(t => t.TodoId == todoId);
            if (todo == null || todo.IsDeleted)
                throw new Exception($"Todo with id {todoId} not found");
            return todo;
        }

        public async Task<Todo> GetTodoByNameAsync(string todoContent)
        {
            var todo = await dbSet.FirstOrDefaultAsync(t => t.TodoContent == todoContent);
            if (todo == null || todo.IsDeleted)
                throw new Exception($"Todo with name {todoContent} not found");
            return todo;
        }

        public async Task<bool> UpdateTodoAsync(Todo todo)
        {
            // AsNoTracking kullandığımız için entity tracked değil
            // Önce attach et, sonra modified olarak işaretle
            var entry = _context.Entry(todo);
            
            // Eğer detached ise attach et
            if (entry.State == Microsoft.EntityFrameworkCore.EntityState.Detached)
            {
                dbSet.Attach(todo);
            }
            
            // Debug: Entity state kontrol et
            Console.WriteLine($"[UpdateTodo BEFORE] TodoId: {todo.TodoId}, IsCompleted: {todo.IsCompleted}, State: {entry.State}");
            
            // Tüm property'leri modified olarak işaretle
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Modified;
            
            Console.WriteLine($"[UpdateTodo AFTER] TodoId: {todo.TodoId}, IsCompleted: {todo.IsCompleted}, State: {entry.State}");
            
            var saved = await _context.SaveChangesAsync();
            Console.WriteLine($"[UpdateTodo] Saved changes: {saved}");
            
            return saved > 0;
        }
    }
}
