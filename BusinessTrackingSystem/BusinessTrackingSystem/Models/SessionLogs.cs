using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Panopa.Models;

public class SessionLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string WorkOrderId { get; set; }  // İş emri ID

    [Required]
    public int SectionId { get; set; }  // Bölüm ID

    [Required]
    public int PersonId { get; set; }  // Personel ID

    [Required]
    public LogType Type { get; set; } 

    public DateTime EventDate { get; set; } = DateTime.UtcNow;
}

public enum LogType
{
    [Description("İşe Başladı")]
    Started = 0,
    
    [Description("İş Durdu")]
    Paused = 1,
    
    [Description("İş Tamamlandı")]
    Completed = 2,
    
    [Description("Onaylandı")]
    Approved = 3,
    
    [Description("Reddedildi")]
    Rejected = 4,
    
    [Description("Yeni Kayıt Oluşturuldu")]
    Created = 5,
    
    Unknown = 6
}
