using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Panopa.Models;
using Panopa.Data;
using Microsoft.EntityFrameworkCore;
using NPOI.XSSF.UserModel;
using Panopa.Interfaces;

namespace Panopa.Services;

public class ExcelUploadService : IExcelUploadService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public ExcelUploadService(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<IEnumerable<UploadedExcelFile>> GetAllAsync()
    {
        return await _context.UploadedExcelFiles.ToListAsync();
    }

    public async Task<UploadedExcelFile> UploadExcelAsync(IFormFile file)
    {
        if (file == null || Path.GetExtension(file.FileName).ToLower() != ".xlsx")
            throw new ArgumentException("Yalnızca .xlsx dosyası yükleyebilirsiniz.");

        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsFolder);

        var newFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, newFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Aktif dosya varsa pasif yap (IsActive = false) - tek aktif dosya varsayımıyla
        var currentActive = await _context.UploadedExcelFiles.FirstOrDefaultAsync(x => x.IsActive && !x.IsDeleted);
        if (currentActive != null)
        {
            currentActive.IsActive = false;
            _context.UploadedExcelFiles.Update(currentActive);
        }

        var uploadedFile = new UploadedExcelFile
        {
            OriginalFileName = file.FileName,
            SavedFileName = newFileName,
            UploadedAt = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = false
        };

        _context.UploadedExcelFiles.Add(uploadedFile);
        await _context.SaveChangesAsync();

        return uploadedFile;
    }

    public async Task<List<Dictionary<string, string>>> GetActiveExcelDataAsync()
    {
        var activeFile = await _context.UploadedExcelFiles
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderByDescending(x => x.UploadedAt)
            .FirstOrDefaultAsync();

        if (activeFile == null)
            return new List<Dictionary<string, string>>();

        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads");
        var filePath = Path.Combine(uploadsFolder, activeFile.SavedFileName);

        if (!File.Exists(filePath))
            return new List<Dictionary<string, string>>();

        return await Task.Run(() => ReadExcelFile(filePath));
    }

    private List<Dictionary<string, string>> ReadExcelFile(string filePath)
    {
        var data = new List<Dictionary<string, string>>();

        using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        var workbook = new XSSFWorkbook(fs);
        var sheet = workbook.GetSheetAt(0);

        var headerRow = sheet.GetRow(0);
        if (headerRow == null)
            return data;

        int cellCount = headerRow.LastCellNum;

        for (int i = 1; i <= sheet.LastRowNum; i++)
        {
            var row = sheet.GetRow(i);
            if (row == null) continue;

            var rowDict = new Dictionary<string, string>();

            for (int j = 0; j < cellCount; j++)
            {
                var headerCell = headerRow.GetCell(j);
                var dataCell = row.GetCell(j);

                var header = headerCell?.ToString() ?? $"Column{j}";
                var value = dataCell?.ToString() ?? string.Empty;

                rowDict[header] = value;
            }
            data.Add(rowDict);
        }
        return data;
    }
}
