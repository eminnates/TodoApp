using Microsoft.AspNetCore.Identity;

namespace TodoApp.API.Models
{
    public class AppUser : IdentityUser
    {

        public int? TodoPoints { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
