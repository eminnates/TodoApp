using Microsoft.EntityFrameworkCore;
using TodoApp.API.Models.Entities;

namespace TodoApp.API.Data.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly DbContext _context;
        private readonly DbSet<Category> _dbSet;

        public CategoryRepository(DbContext context)
        {
            _context = context;
            _dbSet = _context.Set<Category>();
        }

        public async Task<bool> CreateCategoryAsync(Category category)
        {
            await _dbSet.AddAsync(category);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> UpdateCategoryAsync(Category category)
        {
            var entry = _context.Entry(category);
            if (entry.State == EntityState.Detached)
            {
                _dbSet.Attach(category);
            }
            entry.State = EntityState.Modified;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteCategoryAsync(int categoryId)
        {
            var category = await _dbSet
                .Include(c => c.Todos)
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId);
            if (category == null)
                return false;

            // Set all todos in this category to have null CategoryId
            foreach (var todo in category.Todos)
            {
                todo.CategoryId = null;
            }

            category.IsDeleted = true;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<Category?> GetCategoryByIdAsync(int categoryId)
        {
            var category = await _dbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId && !c.IsDeleted);

            if (category != null)
            {
                // Load todos separately
                var todos = await _context.Set<Todo>()
                    .Where(t => t.CategoryId == categoryId && !t.IsDeleted)
                    .AsNoTracking()
                    .ToListAsync();
                category.Todos = todos;
            }

            return category;
        }

        public async Task<List<Category>> GetAllCategoriesByUserIdAsync(string userId)
        {
            var categories = await _dbSet
                .Where(c => c.UserId == userId && !c.IsDeleted)
                .AsNoTracking()
                .ToListAsync();

            // Load todos for all categories in one query
            var categoryIds = categories.Select(c => c.CategoryId).ToList();
            var todos = await _context.Set<Todo>()
                .Where(t => categoryIds.Contains(t.CategoryId.Value) && !t.IsDeleted)
                .AsNoTracking()
                .ToListAsync();

            // Group todos by category
            var todosByCategory = todos.GroupBy(t => t.CategoryId).ToDictionary(g => g.Key, g => g.ToList());

            // Assign todos to categories
            foreach (var category in categories)
            {
                category.Todos = todosByCategory.ContainsKey(category.CategoryId) 
                    ? todosByCategory[category.CategoryId] 
                    : new List<Todo>();
            }

            return categories;
        }

        public async Task<bool> CategoryExistsAsync(int categoryId, string userId)
        {
            return await _dbSet.AnyAsync(c => c.CategoryId == categoryId && c.UserId == userId && !c.IsDeleted);
        }
    }
}
