using TodoApp.API.Models;

namespace TodoApp.API.Data.Repositories
{
    public interface IAppUserRepository
    {
        Task<List<AppUser>> GetAllUsersAsync();
        Task<bool> CreateUserAsync(AppUser user,string password);
        Task<AppUser> GetUserByIdAsync(int id);
        Task<AppUser> GetUserByNameAsync(string userName);
        Task<bool> UpdateUserAsync(AppUser user);    
        Task<bool> SoftDeleteUserAsync(string userId);


    }
}
