namespace TodoApp.API.DTOs.TodoDtos
{
    public class TodoDto
    {
        public int TodoId { get; set; }
        public string TodoContent { get; set; } = null!;
        public bool IsCompleted { get; set; }
        public bool IsDeleted { get; set; }
    }

}
