using FluentValidation;
using TodoApp.API.DTOs.TodoDtos;

namespace TodoApp.API.Models.Validators.Todo
{
    public class UpdateTodoValidator : AbstractValidator<UpdateTodoDto>
    {
        public UpdateTodoValidator()
        {
            RuleFor(x => x.TodoId)
                .GreaterThan(0).WithMessage("Invalid Todo ID");
            RuleFor(x => x.TodoContent)
                .NotEmpty().WithMessage("Todo content is required")
                .Length(3, 200).WithMessage("Todo must be between 3-200 characters");
            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.UtcNow).WithMessage("Due date must be in the future")
                .When(x => x.DueDate.HasValue);
        }
    }
}
