using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TodoApp.API.Models.Enums;

namespace TodoApp.API.Models.Entities
{
    public class Todo
    {
        [Key]
        public int TodoId { get; set; }
        [ForeignKey("AppUser")]
        public string UserId { get; set; } = string.Empty;
        [Required]
        public string TodoContent { get; set; } = string.Empty;
        public bool IsCompleted { get; set; } = false;

        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? DueDate { get; set; }

        public Priority Priority { get; set; } = Priority.Medium;

        [ForeignKey("Category")]
        public int? CategoryId { get; set; }

        public Category? Category { get; set; }
        public AppUser? AppUser { get; set; }
    }
}
