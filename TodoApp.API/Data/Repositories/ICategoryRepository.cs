using TodoApp.API.Models.Entities;

namespace TodoApp.API.Data.Repositories
{
    public interface ICategoryRepository
    {
        Task<bool> CreateCategoryAsync(Category category);
        Task<bool> UpdateCategoryAsync(Category category);
        Task<bool> DeleteCategoryAsync(int categoryId);
        Task<Category?> GetCategoryByIdAsync(int categoryId);
        Task<List<Category>> GetAllCategoriesByUserIdAsync(string userId);
        Task<bool> CategoryExistsAsync(int categoryId, string userId);
    }
}
