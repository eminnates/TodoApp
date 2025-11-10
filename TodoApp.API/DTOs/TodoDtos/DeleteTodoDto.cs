namespace TodoApp.API.DTOs.TodoDtos
{
    public class DeleteTodoDto
    {
        public int TodoId { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}
