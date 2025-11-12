using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApp.API.Data.Repositories;
using TodoApp.API.DTOs.TodoDtos;
using TodoApp.API.Models.Entities;

namespace TodoApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TodoController : ControllerBase
    {
        private readonly ITodoRepository _todoRepository;

        public TodoController(ITodoRepository todoRepository)
        {
            _todoRepository = todoRepository;
        }

        private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        private static TodoDto ToDto(Todo t) => new TodoDto
        {
            TodoId = t.TodoId,
            TodoContent = t.TodoContent,
            IsCompleted = t.IsCompleted,
            IsDeleted = t.IsDeleted
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
                if (todo.UserId != userId || todo.IsDeleted) return NotFound();
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

            var entity = new Todo
            {
                TodoContent = dto.TodoContent,
                DueDate = dto.DueDate,
                UserId = userId,
                IsCompleted = false,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
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

            try
            {
                var existing = await _todoRepository.GetTodoByIdAsync(id);
                if (existing.UserId != userId || existing.IsDeleted) return NotFound();

                existing.TodoContent = dto.TodoContent;
                existing.DueDate = dto.DueDate;
                // keep IsCompleted as-is during content/date update

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
        public async Task<IActionResult> Toggle(int id, [FromBody] ToggleTodoDto? dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var existing = await _todoRepository.GetTodoByIdAsync(id);
                if (existing.UserId != userId || existing.IsDeleted) return NotFound();

                if (dto is null)
                    existing.IsCompleted = !existing.IsCompleted;
                else
                    existing.IsCompleted = dto.IsCompleted;

                var ok = await _todoRepository.UpdateTodoAsync(existing);
                if (!ok) return BadRequest(new { message = "Todo could not be toggled" });
                return NoContent();
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
                if (existing.UserId != userId || existing.IsDeleted) return NotFound();

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
