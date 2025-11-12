using Microsoft.AspNetCore.Mvc;
using TodoApp.API.DTOs.AuthDtos;
using TodoApp.API.Services.Interfaces;

namespace TodoApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Registers a new user.
        /// Returns 201 Created with the created RegisterDto on success.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = await _authService.RegisterAsync(registerDto);
                // Return a safe response without password fields
                var response = new { username = created.Username, fullName = created.FullName };
                return Created(string.Empty, response);
            }
            catch (InvalidOperationException ex)
            {
                // e.g., username already exists
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Authenticates a user and returns a JWT Access Token.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var authResponse = await _authService.LoginAsync(loginDto);
                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                // Return 401 Unauthorized for invalid credentials
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}
