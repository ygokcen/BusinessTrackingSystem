using Panopa.Models;

namespace Panopa.Interfaces;

public interface ISessionLogService
{
    Task<List<SessionLog>> GetAllAsync();
    Task<List<SessionLog>> GetByWorkOrderIdAsync(string workOrderId);
    Task<List<SessionLog>> GetByPersonIdAsync(int personId);
    Task<List<SessionLog>> GetBySectionIdAsync(int sectionId);
}