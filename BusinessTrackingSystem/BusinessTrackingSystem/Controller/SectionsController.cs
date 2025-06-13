using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SectionsController : ControllerBase
    {
        private readonly ISectionService _sectionService;
        private readonly INotificationService _notificationService;

        public SectionsController(ISectionService sectionService, INotificationService notificationService)
        {
            _sectionService = sectionService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sections = await _sectionService.GetAllSectionsAsync();
            return Ok(sections);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var section = await _sectionService.GetSectionByIdAsync(id);
            if (section == null) return NotFound();
            return Ok(section);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Section section)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = await _sectionService.CreateSectionAsync(section);
            
            await _notificationService.SendNotificationAsync(
                title: "Yeni Bölüm Oluşturuldu 🏢",
                icon: "➕",
                description: $"{created.Title} bölümü oluşturuldu.",
                color: "success"
            );
            
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Section section)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var updated = await _sectionService.UpdateSectionAsync(section);
            if (updated == null) return NotFound();
            
            await _notificationService.SendNotificationAsync(
                title: "Bölüm Güncellendi 🔄",
                icon: "📝",
                description: $"{updated.Title} bölümü güncellendi.",
                color: "info"
            );
            
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var section = await _sectionService.GetSectionByIdAsync(id);
            if (section == null) return NotFound();
            
            await _sectionService.DeleteSectionAsync(id);
            
            await _notificationService.SendNotificationAsync(
                title: "Bölüm Silindi 🗑️",
                icon: "❌",
                description: $"{section.Title} bölümü silindi.",
                color: "warning"
            );
            
            return NoContent();
        }
    }
}