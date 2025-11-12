using FluentValidation;
using TodoApp.API.DTOs.AuthDtos;

namespace TodoApp.API.Models.Validators.Auth
{
    public class RegisterValidator : AbstractValidator<RegisterDto>
    {
        public RegisterValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty()
                .MaximumLength(50);
            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(6)
                .MaximumLength(100)
                .ChildRules(password =>
                {
                    password.RuleFor(x => x)
                        .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
                        .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
                        .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
                        .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
                });
        }
    }
}
