namespace TodoApp.API.DTOs.TodoDtos
{
    public class ToggleTodoDto
    {
        public int TodoId { get; set; }
        public bool IsCompleted { get; set; }
    }
}
