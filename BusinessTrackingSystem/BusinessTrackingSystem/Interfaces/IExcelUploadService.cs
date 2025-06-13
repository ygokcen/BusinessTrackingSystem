using Panopa.Models;

namespace Panopa.Interfaces;

public interface IExcelUploadService
{
    Task<UploadedExcelFile> UploadExcelAsync(IFormFile file);
    Task<List<Dictionary<string, string>>> GetActiveExcelDataAsync();
    Task<IEnumerable<UploadedExcelFile>> GetAllAsync();
}