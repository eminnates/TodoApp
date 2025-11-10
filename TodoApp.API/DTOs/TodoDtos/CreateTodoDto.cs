
using TodoApp.API.Models;

namespace TodoApp.API.DTOs.TodoDtos
{
    public class CreateTodoDto
    {
        public string TodoContent { get; set; } = null!;
        public DateTime? DueDate { get; set; }

    }
}
