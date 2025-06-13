using Microsoft.AspNetCore.Mvc;
using Panopa.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Panopa.DTO;

namespace Panopa.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ExcelUploadController : ControllerBase
    {
        private readonly IExcelUploadService _excelUploadService;
        private readonly ILogger<ExcelUploadController> _logger;
        private readonly INotificationService _notificationService;

        public ExcelUploadController(IExcelUploadService excelUploadService, ILogger<ExcelUploadController> logger,
            INotificationService notificationService)
        {
            _excelUploadService = excelUploadService ?? throw new ArgumentNullException(nameof(excelUploadService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync()
        {
            var data = await _excelUploadService.GetAllAsync();
            return Ok(data);
        }

        [HttpGet("download/{fileName}")]
        public IActionResult DownloadFile(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                return BadRequest(new { success = false, message = "Dosya adı belirtilmedi." });

            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            var fullPath = Path.Combine(uploadPath, Path.GetFileName(fileName)); // Güvenlik: path traversal engeli

            if (!System.IO.File.Exists(fullPath))
                return NotFound(new { success = false, message = "Dosya bulunamadı." });

            var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            var fileBytes = System.IO.File.ReadAllBytes(fullPath);

            return File(fileBytes, contentType, fileName);
        }

        [HttpGet("files")]
        public IActionResult ListUploadedFiles()
        {
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

            if (!Directory.Exists(uploadPath))
                return NotFound(new { success = false, message = "Uploads klasörü bulunamadı." });

            var files = Directory.GetFiles(uploadPath, "*.xlsx")
                .Select(Path.GetFileName)
                .ToList();

            return Ok(new { success = true, files });
        }

        /// <summary>
        /// Sadece Excel (.xlsx) dosyası yüklenebilir. Yüklenen dosya kayıt altına alınır.
        /// </summary>
        /// <param name="file">Excel dosyası</param>
        /// <returns>Yükleme sonucu ve durum</returns>
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadExcel([FromForm] ExcelUploadRequest request)
        {
            var file = request.File;
            
            if (file == null)
            {
                _logger.LogWarning("Dosya gelmedi.");
                return BadRequest(new { success = false, message = "Dosya gönderilmedi." });
            }

            if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Geçersiz dosya formatı: {FileName}", file.FileName);
                return BadRequest(new { success = false, message = "Sadece .xlsx uzantılı dosyalar yüklenebilir." });
            }

            try
            {
                _logger.LogInformation("Dosya alındı: {FileName} ({FileLength} bytes)", file.FileName, file.Length);

                var result = await _excelUploadService.UploadExcelAsync(file);

                _logger.LogInformation("Dosya başarıyla işlendi: {FileName}", file.FileName);

                await _notificationService.SendNotificationAsync(
                    title: "Dosya Yüklendi ✅",
                    icon: "📁",
                    description: $"'{file.FileName}' adlı dosya başarıyla yüklendi.",
                    color: "success"
                );

                return Ok(new { success = true, message = "Dosya başarıyla yüklendi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya yüklenirken hata oluştu: {FileName}", file.FileName);
                return BadRequest(new { success = false, message = "Dosya yüklenirken hata oluştu: " + ex.Message });
            }
        }

        [HttpGet("active-data")]
        public async Task<IActionResult> GetActiveExcelFileData()
        {
            var data = await _excelUploadService.GetActiveExcelDataAsync();
            return Ok(new { success = true, data });
        }
    }
}