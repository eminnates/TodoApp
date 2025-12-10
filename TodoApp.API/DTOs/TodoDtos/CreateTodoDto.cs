
using TodoApp.API.Models.Enums;

namespace TodoApp.API.DTOs.TodoDtos
{
    public class CreateTodoDto
    {
        public string TodoContent { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public Priority Priority { get; set; } = Priority.Medium;
        public int? CategoryId { get; set; }

    }
}
