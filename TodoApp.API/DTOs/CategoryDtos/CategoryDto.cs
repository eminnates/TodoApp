namespace TodoApp.API.DTOs.CategoryDtos
{
    public class CategoryDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TodoCount { get; set; }
    }
}
