using FluentValidation;
using TodoApp.API.DTOs.AppUserDtos;

namespace TodoApp.API.Models.Validators.AppUser
{
    public class AppUserValidator : AbstractValidator<AppUserDto>
    {
        public AppUserValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty()
                .MaximumLength(50);
        }
    }
}
