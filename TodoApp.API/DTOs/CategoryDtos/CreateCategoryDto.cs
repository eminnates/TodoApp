namespace TodoApp.API.DTOs.CategoryDtos
{
    public class CreateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = "#3B82F6";
        public string? Icon { get; set; }
    }
}
