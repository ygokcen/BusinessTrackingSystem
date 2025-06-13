namespace Panopa.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(string title, string icon, string description, string color);
}