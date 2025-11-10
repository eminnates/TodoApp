namespace TodoApp.API.DTOs.TodoDtos
{
    public class UpdateTodoDto
    {
        public int TodoId { get; set; }
        public string TodoContent { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
    }
}
