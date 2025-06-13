using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panopa.Models;

public class Person
{
    [Key] public int Id { get; set; }

    [Required(ErrorMessage = "Personel adı zorunludur")]
    [Column(TypeName = "varchar")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Personel soyadı zorunludur")]
    [Column(TypeName = "varchar")]
    [MaxLength(255)]
    public string Surname { get; set; } = string.Empty;

    [Required(ErrorMessage = "Personel telefon numarası zorunludur")]
    [Column(TypeName = "varchar")]
    [MaxLength(255)]
    public string PhoneNumber { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
    [Column(TypeName = "varchar")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    public int? SectionId { get; set; }

    [ForeignKey("SectionId")]
    public Section? Section { get; set; }

    [Required(ErrorMessage = "Personel rolü zorunludur")]
    public PersonRole Role { get; set; }
    
    [Column(TypeName = "varchar")]
    [MaxLength(500)]
    public string HashedPassword { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiryTime { get; set; }
}

public enum PersonRole
{
    Admin = 1,
    Worker = 2
}