using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Panopa.Data;
using Panopa.DTO;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Services
{
    public class AuthService : IAuthService
    {
        private readonly IJwtService _jwtService;
        private readonly AppDbContext _context;

        public AuthService(IJwtService jwtService, AppDbContext context)
        {
            _jwtService = jwtService;
            _context = context;
        }

        public async Task<TokenResponseDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _context.Persons.FirstOrDefaultAsync(x => x.PhoneNumber == request.PhoneNumber);
            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.HashedPassword))
                throw new UnauthorizedAccessException("Kullanıcı adı veya şifre hatalı");

            var accessToken = _jwtService.GeneratePersonToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var role = user.Role;
            var section = user.SectionId;

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Role = role,
                Section = section
            };
        }

        public async Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
        {
            var principal = _jwtService.GetPrincipalFromExpiredToken(request.AccessToken);
            var phone = principal.FindFirst(ClaimTypes.MobilePhone)?.Value;

            var user = await _context.Persons.FirstOrDefaultAsync(x => x.PhoneNumber == phone);
            if (user == null || user.RefreshToken != request.RefreshToken ||
                user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new SecurityTokenException("Geçersiz refresh token");

            var newAccessToken = _jwtService.GeneratePersonToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
            await _context.SaveChangesAsync();

            return new TokenResponseDto { AccessToken = newAccessToken, RefreshToken = newRefreshToken };
        }
    }
}