using FluentValidation;
using TodoApp.API.DTOs.CategoryDtos;

namespace TodoApp.API.Models.Validators.Category
{
    public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryDto>
    {
        public UpdateCategoryValidator()
        {
            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Invalid category id");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Category name is required")
                .Length(1, 50).WithMessage("Category name must be between 1-50 characters");

            RuleFor(x => x.Color)
                .NotEmpty().WithMessage("Color is required")
                .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a valid hex code");

            RuleFor(x => x.Icon)
                .MaximumLength(50).WithMessage("Icon name must be less than 50 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Icon));
        }
    }
}
