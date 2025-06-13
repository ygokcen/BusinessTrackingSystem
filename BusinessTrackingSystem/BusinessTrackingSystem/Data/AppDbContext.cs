using Microsoft.EntityFrameworkCore;
using Panopa.Models;

namespace Panopa.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Section> Sections { get; set; } = null!;
    public DbSet<SessionLog> SessionLogs { get; set; } = null!;
    public DbSet<SectionWorkAssignment> SectionWorkAssignments { get; set; } = null!;
    public DbSet<Person> Persons { get; set; } = null!;
    public DbSet<UploadedExcelFile> UploadedExcelFiles { get; set; } = null!;
}