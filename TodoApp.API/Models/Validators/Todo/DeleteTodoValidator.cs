using FluentValidation;
using TodoApp.API.DTOs.TodoDtos;

namespace TodoApp.API.Models.Validators.Todo
{
    public class DeleteTodoValidator : AbstractValidator<DeleteTodoDto>
    {
        public DeleteTodoValidator()
        {
            RuleFor(x => x.TodoId)
                .GreaterThan(0).WithMessage("Invalid Todo ID");
        }
    }
}
