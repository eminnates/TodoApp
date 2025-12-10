using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.API.Data.Repositories;
using TodoApp.API.DTOs.CategoryDtos;
using TodoApp.API.Models.Entities;

namespace TodoApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryController(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        private static CategoryDto ToDto(Category c) => new CategoryDto
        {
            CategoryId = c.CategoryId,
            Name = c.Name,
            Color = c.Color,
            Icon = c.Icon,
            CreatedAt = c.CreatedAt,
            TodoCount = c.Todos?.Count(t => !t.IsDeleted) ?? 0
        };

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var categories = await _categoryRepository.GetAllCategoriesByUserIdAsync(userId);
            return Ok(categories.Select(ToDto));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CategoryDto>> GetById(int id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var category = await _categoryRepository.GetCategoryByIdAsync(id);
            if (category == null) return NotFound();
            if (category.UserId != userId) return Forbid();

            return Ok(ToDto(category));
        }

        [HttpPost]
        public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var entity = new Category
            {
                Name = dto.Name,
                Color = dto.Color,
                Icon = dto.Icon,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _categoryRepository.CreateCategoryAsync(entity);
            if (!created) return BadRequest(new { message = "Category could not be created" });

            return CreatedAtAction(nameof(GetById), new { id = entity.CategoryId }, ToDto(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var existing = await _categoryRepository.GetCategoryByIdAsync(id);
            if (existing == null) return NotFound();
            if (existing.UserId != userId) return Forbid();

            existing.Name = dto.Name;
            existing.Color = dto.Color;
            existing.Icon = dto.Icon;

            var updated = await _categoryRepository.UpdateCategoryAsync(existing);
            if (!updated) return BadRequest(new { message = "Category could not be updated" });

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var existing = await _categoryRepository.GetCategoryByIdAsync(id);
            if (existing == null) return NotFound();
            if (existing.UserId != userId) return Forbid();

            var deleted = await _categoryRepository.DeleteCategoryAsync(id);
            if (!deleted) return BadRequest(new { message = "Category could not be deleted" });

            return NoContent();
        }
    }
}
