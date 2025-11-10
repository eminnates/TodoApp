
using TodoApp.API.Models;

namespace TodoApp.API.DTOs.TodoDtos
{
    public class CreateTodoDto
    {
        public string TodoContent { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }

    }
}
