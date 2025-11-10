using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TodoApp.API.Models.Entites;

namespace TodoApp.API.Data
{
    public class DbContext : IdentityDbContext<AppUser>
    {
        public DbContext(DbContextOptions<DbContext> options) : base(options){}

        public DbSet<Todo> Todo { get; set; }

        }
}
