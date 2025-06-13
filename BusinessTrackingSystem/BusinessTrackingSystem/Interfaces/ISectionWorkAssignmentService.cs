using Panopa.Models;

namespace Panopa.Interfaces
{
    public interface ISectionWorkAssignmentService
    {
        Task<IEnumerable<SectionWorkAssignment>> GetAllAssignmentsAsync();
        Task<SectionWorkAssignment?> GetAssignmentByIdAsync(int id);
        Task<SectionWorkAssignment> CreateAssignmentAsync(SectionWorkAssignment assignment);
        Task<SectionWorkAssignment> UpdateAssignmentAsync(SectionWorkAssignment assignment);
        Task DeleteAssignmentAsync(int id);
        Task<SectionWorkAssignment?> UpdateStatusAsync(string workOrderId, int sectionId, int newStatus);
        Task<SectionWorkAssignment?> UpdateApprovalAsync(int id, int newApprovalStatus, string notes);
        Task<string> PauseAllExceptCompletedAsync();
        Task<string> ResumeAllExceptCompletedAsync();
    }
}