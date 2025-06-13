using Panopa.Models;

namespace Panopa.Interfaces;

public interface IWork
{
    Task<IEnumerable<Section>> GetAllAsync();
    Task<Section?> GetByIdAsync(int id);
    Task<Section> CreateAsync(Section section);
    Task<Section?> UpdateAsync(int id, Section section);
    Task<bool> SoftDeleteAsync(int id);
}