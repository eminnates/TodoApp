using TodoApp.API.Models;

namespace TodoApp.API.Data.Repositories
{
    public interface ITodoRepository
    {
        public Task<bool> CreateTodoAsync(Todo todo);
        public Task<bool> UpdateTodoAsync(Todo todo);
        public Task<bool> DeleteTodoAsync(int todoId);
        public Task<Todo> GetTodoByIdAsync(int todoId);
        public Task<Todo> GetTodoByNameAsync(string todoContent);
        public Task<List<Todo>> GetAllTodosAsync();
    }
}
