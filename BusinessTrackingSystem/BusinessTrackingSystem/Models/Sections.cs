using System.ComponentModel.DataAnnotations;

namespace Panopa.Models;

public class Section
{
    [Key]
    public int Id { get; set; }

    [Required(ErrorMessage = "Bölüm adı zorunludur")]
    public string Title { get; set; } = string.Empty;

    public int AddedByPersonId { get; set; }

    public DateTime CreationDate { get; set; } = DateTime.UtcNow;

    public DateTime? DeletionDate { get; set; }

    public bool IsDeleted { get; set; } = false;
}