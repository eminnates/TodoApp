using FluentValidation;
using TodoApp.API.DTOs.TodoDtos;
using TodoApp.API.Models.Enums;

namespace TodoApp.API.Models.Validation.Todo
{
    public class CreateTodoValidator : AbstractValidator<CreateTodoDto>
    {
        public CreateTodoValidator()
        {
            RuleFor(x => x.TodoContent)
                .NotEmpty().WithMessage("Todo content is required")
                .Length(3, 200).WithMessage("Todo must be between 3-200 characters");
            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.UtcNow).WithMessage("Due date must be in the future")
                .When(x => x.DueDate.HasValue);
            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Invalid priority level");
            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Invalid category id")
                .When(x => x.CategoryId.HasValue);
        }
    }
}
