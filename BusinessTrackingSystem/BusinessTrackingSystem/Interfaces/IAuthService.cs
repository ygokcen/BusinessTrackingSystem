using Panopa.DTO;

namespace Panopa.Interfaces;

public interface IAuthService
{
    Task<TokenResponseDto> LoginAsync(LoginRequestDto request);
    Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);
}