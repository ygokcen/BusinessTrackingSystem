using Microsoft.AspNetCore.Mvc;
using Panopa.DTO;
using Panopa.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly INotificationService _notificationService;

    public AuthController(IAuthService authService, INotificationService notificationService)
    {
        _authService = authService;
        _notificationService = notificationService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        
        await _notificationService.SendNotificationAsync(
            title: "Yeni Giriş Yapıldı 🔐",
            icon: "👤",
            description: $"{dto.PhoneNumber} numaralı kullanıcı giriş yaptı.",
            color: "info"
        );
        
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto);
        
        await _notificationService.SendNotificationAsync(
            title: "Token Yenilendi 🔄",
            icon: "🔄",
            description: "Oturum süresi yenilendi.",
            color: "info"
        );
        
        return Ok(result);
    }
}