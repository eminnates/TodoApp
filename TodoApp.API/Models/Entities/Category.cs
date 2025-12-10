using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApp.API.Models.Entities
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [ForeignKey("AppUser")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(7)]
        public string Color { get; set; } = "#3B82F6";

        [StringLength(50)]
        public string? Icon { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public AppUser? AppUser { get; set; }
        public ICollection<Todo>? Todos { get; set; }
    }
}
