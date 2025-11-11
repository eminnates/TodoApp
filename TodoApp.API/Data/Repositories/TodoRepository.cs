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
            var todo = await dbSet.FirstOrDefaultAsync(t => t.TodoId == todoId);
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
            var existingTodo = await GetTodoByIdAsync(todo.TodoId);
            existingTodo.TodoContent = todo.TodoContent;
            existingTodo.IsCompleted = todo.IsCompleted;
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
