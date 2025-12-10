using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.API.Data.Repositories;
using TodoApp.API.DTOs.CategoryDtos;
using TodoApp.API.DTOs.TodoDtos;
using TodoApp.API.Models.Entities;
using TodoApp.API.Models.Enums;

namespace TodoApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TodoController : ControllerBase
    {
        private readonly ITodoRepository _todoRepository;
        private readonly ICategoryRepository _categoryRepository;

        public TodoController(ITodoRepository todoRepository, ICategoryRepository categoryRepository)
        {
            _todoRepository = todoRepository;
            _categoryRepository = categoryRepository;
        }

        private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        private static TodoDto ToDto(Todo t) => new TodoDto
        {
            TodoId = t.TodoId,
            TodoContent = t.TodoContent,
            IsCompleted = t.IsCompleted,
            CreatedAt = t.CreatedAt,
            DueDate = t.DueDate,
            Priority = t.Priority,
            CategoryId = t.CategoryId,
            Category = t.Category == null ? null : new CategoryDto
            {
                CategoryId = t.Category.CategoryId,
                Name = t.Category.Name,
                Color = t.Category.Color,
                Icon = t.Category.Icon,
                CreatedAt = t.Category.CreatedAt,
                TodoCount = 0
            }
        };

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoDto>>> GetAll()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var todos = await _todoRepository.GetAllTodosAsync();
            var result = todos.Where(t => t.UserId == userId).Select(ToDto).ToList();
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TodoDto>> GetById(int id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            try
            {
                var todo = await _todoRepository.GetTodoByIdAsync(id);
                if (todo.IsDeleted) return NotFound();
                if (todo.UserId != userId) return Forbid(); // 403 Forbidden
                return Ok(ToDto(todo));
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpPost]
        public async Task<ActionResult<TodoDto>> Create([FromBody] CreateTodoDto dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (dto.CategoryId.HasValue)
            {
                var exists = await _categoryRepository.CategoryExistsAsync(dto.CategoryId.Value, userId);
                if (!exists) return BadRequest(new { message = "Category not found" });
            }

            // Convert DueDate to UTC if it has a value
            DateTime? dueDate = dto.DueDate.HasValue 
                ? DateTime.SpecifyKind(dto.DueDate.Value, DateTimeKind.Utc)
                : null;

            var entity = new Todo
            {
                TodoContent = dto.TodoContent,
                DueDate = dueDate,
                UserId = userId,
                IsCompleted = false,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                Priority = dto.Priority,
                CategoryId = dto.CategoryId
            };

            var created = await _todoRepository.CreateTodoAsync(entity);
            if (!created) return BadRequest(new { message = "Todo could not be created" });

            var response = ToDto(entity);
            return CreatedAtAction(nameof(GetById), new { id = entity.TodoId }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTodoDto dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (dto.CategoryId.HasValue)
            {
                var exists = await _categoryRepository.CategoryExistsAsync(dto.CategoryId.Value, userId);
                if (!exists) return BadRequest(new { message = "Category not found" });
            }

            try
            {
                var existing = await _todoRepository.GetTodoByIdAsync(id);
                if (existing.IsDeleted) return NotFound();
                if (existing.UserId != userId) return Forbid(); // 403 Forbidden

                existing.TodoContent = dto.TodoContent;
                
                // Convert DueDate to UTC if it has a value
                existing.DueDate = dto.DueDate.HasValue 
                    ? DateTime.SpecifyKind(dto.DueDate.Value, DateTimeKind.Utc)
                    : null;
                // keep IsCompleted as-is during content/date update
                existing.Priority = dto.Priority;
                existing.CategoryId = dto.CategoryId;

                var ok = await _todoRepository.UpdateTodoAsync(existing);
                if (!ok) return BadRequest(new { message = "Todo could not be updated" });
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpPatch("{id:int}/toggle")]
        public async Task<ActionResult<TodoDto>> Toggle(int id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var existing = await _todoRepository.GetTodoByIdAsync(id);
                if (existing.IsDeleted) return NotFound();
                if (existing.UserId != userId) return Forbid();

                existing.IsCompleted = !existing.IsCompleted;

                var ok = await _todoRepository.UpdateTodoAsync(existing);
                if (!ok) return BadRequest(new { message = "Todo could not be toggled" });
                
                var updated = await _todoRepository.GetTodoByIdAsync(id);
                
                return Ok(ToDto(updated));
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var existing = await _todoRepository.GetTodoByIdAsync(id);
                if (existing.IsDeleted) return NotFound();
                if (existing.UserId != userId) return Forbid(); // 403 Forbidden

                var ok = await _todoRepository.DeleteTodoAsync(id);
                if (!ok) return BadRequest(new { message = "Todo could not be deleted" });
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpGet("completed")]
        public async Task<ActionResult<IEnumerable<TodoDto>>> GetCompleted()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var todos = await _todoRepository.GetAllTodosAsync();
            var result = todos.Where(t => t.UserId == userId && t.IsCompleted).Select(ToDto).ToList();
            return Ok(result);
        }

        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<TodoDto>>> GetPending()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var todos = await _todoRepository.GetAllTodosAsync();
            var result = todos.Where(t => t.UserId == userId && !t.IsCompleted).Select(ToDto).ToList();
            return Ok(result);
        }

        [HttpGet("today")]
        public async Task<ActionResult<IEnumerable<TodoDto>>> GetToday()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var today = DateTime.UtcNow.Date;
            var todos = await _todoRepository.GetAllTodosAsync();
            var result = todos
                .Where(t => t.UserId == userId && t.DueDate.HasValue && t.DueDate.Value.Date == today)
                .Select(ToDto)
                .ToList();
            return Ok(result);
        }
    }
}
