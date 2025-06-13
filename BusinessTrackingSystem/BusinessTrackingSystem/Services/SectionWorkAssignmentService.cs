using Microsoft.EntityFrameworkCore;
using Panopa.Data;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Services
{
    public class SectionWorkAssignmentService : ISectionWorkAssignmentService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISessionLogService _sessionLogService;
        private readonly int _personId;

        public SectionWorkAssignmentService(
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor,
            ISessionLogService sessionLogService)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _sessionLogService = sessionLogService;

            // JWT'den CompanyId'yi al
            var personIdClain = _httpContextAccessor.HttpContext?.User?.FindFirst("PersonId");
            if (personIdClain != null && int.TryParse(personIdClain.Value, out int personId))
            {
                _personId = personId;
            }
        }

        public async Task<IEnumerable<SectionWorkAssignment>> GetAllAssignmentsAsync()
        {
            return await _context.SectionWorkAssignments
                .Include(a => a.Person)
                .Include(a => a.Section)
                .ToListAsync();
        }

        public async Task<SectionWorkAssignment?> GetAssignmentByIdAsync(int id)
        {
            return await _context.SectionWorkAssignments
                .Include(a => a.Person)
                .Include(a => a.Section)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<SectionWorkAssignment> CreateAssignmentAsync(SectionWorkAssignment assignment)
        {
            _context.SectionWorkAssignments.Add(assignment);
            await _context.SaveChangesAsync();
            return assignment;
        }

        public async Task<SectionWorkAssignment> UpdateAssignmentAsync(SectionWorkAssignment assignment)
        {
            _context.SectionWorkAssignments.Update(assignment);
            await _context.SaveChangesAsync();
            return assignment;
        }

        public async Task DeleteAssignmentAsync(int id)
        {
            var assignment = await _context.SectionWorkAssignments.FindAsync(id);
            if (assignment != null)
            {
                _context.SectionWorkAssignments.Remove(assignment);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<SectionWorkAssignment?> UpdateStatusAsync(string workOrderId, int sectionId, int newStatus)
        {
            var assignment = await _context.SectionWorkAssignments
                .FirstOrDefaultAsync(a => a.WorkOrderId == workOrderId && a.SectionId == sectionId);

            if (assignment == null)
            {
                // Yeni kayıt oluştur
                assignment = new SectionWorkAssignment
                {
                    WorkOrderId = workOrderId,
                    SectionId = sectionId,
                    PersonId = _personId,
                    Status = (WorkStatus)newStatus,
                    StartDate = DateTime.UtcNow,
                    ApprovalStatus = ApprovalStatus.Pending
                };

                _context.SectionWorkAssignments.Add(assignment);

                // Yeni kayıt için log oluştur - işe başlanmış olarak kaydet
                var log = new SessionLog
                {
                    WorkOrderId = workOrderId,
                    SectionId = sectionId,
                    PersonId = _personId,
                    Type = LogType.Started,
                    EventDate = DateTime.UtcNow
                };
                _context.SessionLogs.Add(log);
            }
            else
            {
                var oldStatus = assignment.Status;
                assignment.Status = (WorkStatus)newStatus;

                // Durum değişikliği için log oluştur
                var log = new SessionLog
                {
                    WorkOrderId = workOrderId,
                    SectionId = sectionId,
                    PersonId = _personId,
                    Type = GetLogType((WorkStatus)newStatus),
                    EventDate = DateTime.UtcNow
                };
                _context.SessionLogs.Add(log);
            }

            await _context.SaveChangesAsync();
            return assignment;
        }

        public async Task<SectionWorkAssignment?> UpdateApprovalAsync(int id, int newApprovalStatus, string notes)
        {
            var assignment = await _context.SectionWorkAssignments.FindAsync(id);
            if (assignment == null)
                return null;

            if (!Enum.IsDefined(typeof(ApprovalStatus), newApprovalStatus))
                throw new InvalidOperationException("Geçersiz onay durumu.");

            var statusEnum = (ApprovalStatus)newApprovalStatus;

            assignment.ApprovalStatus = statusEnum;
            assignment.ApprovalNotes = notes;

            LogType logType = statusEnum switch
            {
                ApprovalStatus.Approved => LogType.Approved,
                ApprovalStatus.Rejected => LogType.Rejected,
                _ => throw new InvalidOperationException("Desteklenmeyen onay durumu.")
            };

            AddSessionLog(assignment, logType);

            await _context.SaveChangesAsync();
            return assignment;
        }


        /// <summary>
        /// Log verisini EF context'e ekler.
        /// SaveChanges üst seviyede çağrılmalıdır.
        /// </summary>
        private void AddSessionLog(SectionWorkAssignment assignment, LogType logType)
        {
            var log = new SessionLog
            {
                WorkOrderId = assignment.WorkOrderId,
                SectionId = assignment.SectionId,
                PersonId = assignment.PersonId,
                Type = logType,
                EventDate = DateTime.UtcNow
            };

            _context.SessionLogs.Add(log);
        }

        private LogType GetLogType(WorkStatus status)
        {
            return status switch
            {
                WorkStatus.Started => LogType.Started,
                WorkStatus.Paused => LogType.Paused,
                WorkStatus.Completed => LogType.Completed,
                _ => LogType.Unknown
            };
        }

        public async Task<string> PauseAllExceptCompletedAsync()
        {
            var assignmentsToPause = await _context.SectionWorkAssignments
                .Where(a => a.Status != WorkStatus.Completed)
                .ToListAsync();

            foreach (var assignment in assignmentsToPause)
            {
                assignment.Status = WorkStatus.Paused;
                assignment.PauseDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return "success";
        }

        public async Task<string> ResumeAllExceptCompletedAsync()
        {
            var assignmentsToResume = await _context.SectionWorkAssignments
                .Where(a => a.Status != WorkStatus.Completed)
                .ToListAsync();

            foreach (var assignment in assignmentsToResume)
            {
                assignment.Status = WorkStatus.Started;
                assignment.PauseDate = null;
            }

            await _context.SaveChangesAsync();
            return "success";
        }
    }
}