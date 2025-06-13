using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Panopa.Hubs;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Panopa.Interfaces;

namespace Panopa.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationController(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] NotificationDto notification)
        {
            notification.Time = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
            return Ok(new { message = "Bildirim gönderildi." });
        }
    }

    public class NotificationDto
    {
        public string Title { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public string Color { get; set; } // örn. success, danger, warning
        public string Time { get; set; }
    }
}