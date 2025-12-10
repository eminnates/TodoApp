using TodoApp.API.Models.Enums;

namespace TodoApp.API.DTOs.TodoDtos
{
    public class UpdateTodoDto
    {
        public int TodoId { get; set; }
        public string TodoContent { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public Priority Priority { get; set; }
        public int? CategoryId { get; set; }
    }
}
