using FluentValidation;
using FluentValidation.AspNetCore; // Add this using directive

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation(); // Register FluentValidation auto-validation
builder.Services.AddValidatorsFromAssemblyContaining<Program>(); // Register validators

var app = builder.Build();

app.Run();
