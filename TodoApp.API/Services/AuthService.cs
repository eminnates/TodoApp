using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using TodoApp.API.Data.Repositories;
using TodoApp.API.DTOs.AuthDtos;
using TodoApp.API.Models.Entities;
using TodoApp.API.Services.Interfaces;

namespace TodoApp.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAppUserRepository _userRepository;
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration, SignInManager<AppUser> signInManager, UserManager<AppUser> userManager, IAppUserRepository userRepository)
        {
            _configuration = configuration;
            _signInManager = signInManager;
            _userManager = userManager;
            _userRepository = userRepository;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.Username);
            if (user == null || !user.IsActive)
                throw new Exception("User not found or inactive");
            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            if (!result.Succeeded)
                throw new Exception("Invalid username or password");

            var token = GenerateJwtToken(user, out var expiresAt);

            return new AuthResponseDto
            {
                AccessToken = token,
                ExpiresAt = expiresAt
            };
        }

        private string GenerateJwtToken(AppUser user, out DateTime expiresAt)
        {
            var jwtSection = _configuration.GetSection("Jwt");
            var key = jwtSection.GetValue<string>("Key");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expiresMinutes = jwtSection.GetValue<int>("ExpiresMinutes", 60);

            expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            var keyBytes = Encoding.UTF8.GetBytes(key ?? string.Empty);
            var signingKey = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expiresAt,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<bool> Logout(string userId)
        {
            await _signInManager.SignOutAsync();
            return true;
        }

        public Task<RegisterDto> RefreshTokenAsync(string refreshToken)
        {
            throw new NotImplementedException();
        }


    public async Task<RegisterDto> RegisterAsync(RegisterDto registerDto)
        {
            try 
            {
                var existingUser = await _userRepository.GetUserByNameAsync(registerDto.Username);
                throw new InvalidOperationException("Username already exists");
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                // User doesn't exist, continue with registration
            }
            var appUser = new AppUser 
            {
                UserName = registerDto.Username,
                FullName = registerDto.FullName,
                IsActive = true
            };

            var created = await _userRepository.CreateUserAsync(appUser, registerDto.Password);
            if (!created)
                throw new Exception("User could not be created");

            // Map AppUser to RegisterDto before returning
            return new RegisterDto
            {
                Username = appUser.UserName,
                FullName = appUser.FullName,

            };

        }
    }
}
