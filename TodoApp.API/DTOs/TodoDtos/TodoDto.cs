namespace TodoApp.API.DTOs.TodoDtos
{
    public class TodoDto
    {
        public int TodoId { get; set; }
        public string TodoContent { get; set; } = null!;
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DueDate { get; set; }
    }

}
