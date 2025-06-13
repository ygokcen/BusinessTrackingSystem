using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Panopa.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task SendNotification(string title, string icon, string description, string color, string time)
        {
            await Clients.All.SendAsync("ReceiveNotification", new
            {
                title,
                icon,
                description,
                color,
                time
            });
        }
    }
}