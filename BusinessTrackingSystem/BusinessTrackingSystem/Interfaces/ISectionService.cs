using Panopa.Models;

namespace Panopa.Interfaces
{
    public interface ISectionService
    {
        Task<IEnumerable<Section>> GetAllSectionsAsync();
        Task<Section?> GetSectionByIdAsync(int id);
        Task<Section> CreateSectionAsync(Section section);
        Task<Section> UpdateSectionAsync(Section section);
        Task DeleteSectionAsync(int id);
    }
} 