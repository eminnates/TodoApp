using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApp.API.Models
{
    public class Todo
    {
        [Key]
        public int TodoId { get; set; }
        [ForeignKey("AppUser")]
        public int UserId { get; set; }
        [Required]
        public string TodoContent { get; set; } = string.Empty;
        public bool IsCompleted { get; set; } = false;

        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? DueDate { get; set; }

        public AppUser AppUser { get; set; }
    }
}
