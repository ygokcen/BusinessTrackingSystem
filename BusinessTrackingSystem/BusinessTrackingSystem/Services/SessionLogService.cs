using Microsoft.EntityFrameworkCore;
using Panopa.Data;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Services
{
    public class SessionLogService : ISessionLogService
    {
        private readonly AppDbContext _context;

        public SessionLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<SessionLog>> GetAllAsync()
        {
            return await _context.SessionLogs
                .OrderByDescending(x => x.EventDate)
                .ToListAsync();
        }

        public async Task<List<SessionLog>> GetByWorkOrderIdAsync(string workOrderId)
        {
            return await _context.SessionLogs
                .Where(x => x.WorkOrderId == workOrderId)
                .OrderByDescending(x => x.EventDate)
                .ToListAsync();
        }

        public async Task<List<SessionLog>> GetByPersonIdAsync(int personId)
        {
            return await _context.SessionLogs
                .Where(x => x.PersonId == personId)
                .OrderByDescending(x => x.EventDate)
                .ToListAsync();
        }

        public async Task<List<SessionLog>> GetBySectionIdAsync(int sectionId)
        {
            return await _context.SessionLogs
                .Where(x => x.SectionId == sectionId)
                .OrderByDescending(x => x.EventDate)
                .ToListAsync();
        }
    }
}