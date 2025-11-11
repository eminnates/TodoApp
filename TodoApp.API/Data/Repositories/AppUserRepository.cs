using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TodoApp.API.Models.Entities;

namespace TodoApp.API.Data.Repositories
{
    public class AppUserRepository : IAppUserRepository
    {
        private readonly UserManager<AppUser> _userManager;

        public AppUserRepository(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<bool> CreateUserAsync(AppUser user, string password)
        {
            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Failed to create user: {errors}");
            }
            return result.Succeeded;
        }

        public async Task<bool> SoftDeleteUserAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new Exception($"User {userId} not found");

            user.IsActive = false;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to soft delete: {errors}");
            }
            return true;
        }

        public async Task<List<AppUser>> GetAllUsersAsync()
        {
            return await _userManager.Users
                .Where(u => u.IsActive)
                .AsNoTracking()
                .ToListAsync();

        }

        public async Task<AppUser> GetUserByIdAsync(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null || !user.IsActive)
                throw new Exception($"User with ID {id} not found or inactive");
            return user;
        }

        public async Task<AppUser> GetUserByNameAsync(string userName)
        {
            if (string.IsNullOrWhiteSpace(userName))
                throw new ArgumentException("Username cannot be empty", nameof(userName));

            var user = await _userManager.FindByNameAsync(userName); // ✅ UserManager'ın metodu
            if (user == null || !user.IsActive)
                throw new Exception($"User '{userName}' not found or inactive");
            return user;
        }

        public async Task<bool> UpdateUserAsync(AppUser user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            var existingUser = await _userManager.FindByIdAsync(user.Id);
            if (existingUser == null)
                throw new Exception($"User {user.Id} not found");

            // Sadece güncellenebilir alanları değiştir
            existingUser.Email = user.Email;
            existingUser.UserName = user.UserName;
            existingUser.PhoneNumber = user.PhoneNumber;

            var result = await _userManager.UpdateAsync(existingUser);
            if (!result.Succeeded)
                throw new InvalidOperationException(
                    string.Join(", ", result.Errors.Select(e => e.Description)));

            return true;
        }
    }
}
