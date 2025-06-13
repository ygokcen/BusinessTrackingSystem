using Microsoft.AspNetCore.SignalR;
using Panopa.Hubs;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(string title, string icon, string description, string color)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
        {
            Title = title,
            Icon = icon,
            Description = description,
            Color = color,
            Time = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
        });
    }
}
