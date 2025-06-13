using Panopa.Models;

namespace Panopa.DTO;

public class TokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public PersonRole Role { get; set; }
    public int? Section { get; set; }
}