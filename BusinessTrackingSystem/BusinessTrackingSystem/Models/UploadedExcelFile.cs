namespace Panopa.Models
{
    public class UploadedExcelFile
    {
        public int Id { get; set; }
        public string OriginalFileName { get; set; } = null!;
        public string SavedFileName { get; set; } = null!;
        public DateTime UploadedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public bool IsActive { get; set; }
    }
}