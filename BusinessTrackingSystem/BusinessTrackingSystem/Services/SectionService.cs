using Microsoft.EntityFrameworkCore;
using Panopa.Data;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Services
{
    public class SectionService : ISectionService
    {
        private readonly AppDbContext _context;

        public SectionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Section>> GetAllSectionsAsync()
        {
            return await _context.Sections.ToListAsync();
        }

        public async Task<Section?> GetSectionByIdAsync(int id)
        {
            return await _context.Sections.FindAsync(id);
        }

        public async Task<Section> CreateSectionAsync(Section section)
        {
            _context.Sections.Add(section);
            await _context.SaveChangesAsync();
            return section;
        }

        public async Task<Section> UpdateSectionAsync(Section section)
        {
            _context.Sections.Update(section);
            await _context.SaveChangesAsync();
            return section;
        }

        public async Task DeleteSectionAsync(int id)
        {
            var section = await _context.Sections.FindAsync(id);
            if (section != null)
            {
                _context.Sections.Remove(section);
                await _context.SaveChangesAsync();
            }
        }
    }
}