using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TodoApp.API.Data.Repositories;
using TodoApp.API.Models.Entities;
using TodoApp.API.Services;
using TodoApp.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add controllers and FluentValidation
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Configure EF Core - use in-memory DB for local/dev. Replace with real DB in production.
builder.Services.AddDbContext<TodoApp.API.Data.DbContext>(options =>
	options.UseInMemoryDatabase("TodoAppDb"));

// Configure Identity
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
	options.Password.RequireDigit = false;
	options.Password.RequireLowercase = false;
	options.Password.RequireUppercase = false;
	options.Password.RequireNonAlphanumeric = false;
	options.Password.RequiredLength = 6;
})
	.AddEntityFrameworkStores<TodoApp.API.Data.DbContext>()
	.AddDefaultTokenProviders();

// JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
// Prefer environment variable for the secret (JWT_KEY). Fall back to configuration if not present.
var envKey = Environment.GetEnvironmentVariable("JWT_KEY");
var key = !string.IsNullOrEmpty(envKey) ? envKey : jwtSection.GetValue<string>("Key");
if (string.IsNullOrEmpty(key))
{
	throw new InvalidOperationException("JWT Key is not configured. Set environment variable JWT_KEY or Jwt:Key in configuration.");
}
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

builder.Services.AddAuthentication(options =>
{
	options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
	.AddJwtBearer(options =>
	{
		options.RequireHttpsMetadata = false;
		options.SaveToken = true;
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidIssuer = jwtSection.GetValue<string>("Issuer"),
			ValidateAudience = true,
			ValidAudience = jwtSection.GetValue<string>("Audience"),
			ValidateIssuerSigningKey = true,
			IssuerSigningKey = signingKey,
			ValidateLifetime = true
		};
	});

// Register application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAppUserRepository,AppUserRepository>();

var app = builder.Build();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
