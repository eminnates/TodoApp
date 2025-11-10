namespace TodoApp.API.DTOs.AuthDtos
{
    public class RegisterDto
    {
        public string FullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
