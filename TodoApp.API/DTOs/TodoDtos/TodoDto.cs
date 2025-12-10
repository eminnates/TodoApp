using TodoApp.API.DTOs.CategoryDtos;
using TodoApp.API.Models.Enums;

namespace TodoApp.API.DTOs.TodoDtos
{
    public class TodoDto
    {
        public int TodoId { get; set; }
        public string TodoContent { get; set; } = null!;
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public Priority Priority { get; set; }
        public int? CategoryId { get; set; }
        public CategoryDto? Category { get; set; }
    }

}
