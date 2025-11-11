using TodoApp.API.DTOs.AuthDtos;
using TodoApp.API.Models.Entities;
namespace TodoApp.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<RegisterDto> RegisterAsync(RegisterDto registerDto);
        Task<RegisterDto> RefreshTokenAsync(string refreshToken);
        Task<bool> Logout(string userId);
    }
}
