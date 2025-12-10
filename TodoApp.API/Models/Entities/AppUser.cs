using Microsoft.AspNetCore.Identity;

namespace TodoApp.API.Models.Entities
{
    public class AppUser : IdentityUser
    {
        public string? FullName { get; set; } = string.Empty;
        public int? TodoPoints { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Category>? Categories { get; set; }
        public ICollection<Todo>? Todos { get; set; }
    }
}
