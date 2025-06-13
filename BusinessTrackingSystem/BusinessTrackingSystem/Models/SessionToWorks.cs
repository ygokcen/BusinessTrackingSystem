using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panopa.Models;

public class SectionWorkAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SectionId { get; set; }

    [ForeignKey("SectionId")]
    public Section? Section { get; set; }

    [Required]
    public string WorkOrderId { get; set; }
    
    public int PersonId { get; set; }

    [ForeignKey("PersonId")]
    public Person? Person { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime? EndDate { get; set; }

    public DateTime? PauseDate { get; set; }

    public WorkStatus Status { get; set; } = WorkStatus.Pending;

    public string? Description { get; set; }

    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

    public string? ApprovalNotes { get; set; }
}

public enum WorkStatus
{
    Pending = 0,      // Bekliyor
    Started = 1,      // Başladı
    Completed = 2,    // Bitti
    Paused = 3        // Durduruldu
}

public enum ApprovalStatus
{
    Pending = 0,      // Onay bekliyor
    Approved = 1,     // Onaylandı
    Rejected = 2      // Reddedildi
}