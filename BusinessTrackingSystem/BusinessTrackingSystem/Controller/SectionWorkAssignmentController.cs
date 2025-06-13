using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SectionWorkAssignmentController : ControllerBase
    {
        private readonly ISectionWorkAssignmentService _service;
        private readonly INotificationService _notificationService;

        public SectionWorkAssignmentController(ISectionWorkAssignmentService service,
            INotificationService notificationService)
        {
            _service = service;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAssignmentsAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetAssignmentByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SectionWorkAssignment assignment)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = await _service.CreateAssignmentAsync(assignment);

            await _notificationService.SendNotificationAsync(
                title: "Yeni İş Ataması Oluşturuldu 📋",
                icon: "➕",
                description: $"İş emri {created.WorkOrderId} için yeni atama oluşturuldu.",
                color: "success"
            );

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }


        [HttpPut("{workOrderId}/sections/{sectionId}/status/{status}")]
        public async Task<IActionResult> UpdateStatus(string workOrderId, int sectionId, int status)
        {
            // Enum değeri geçerli mi kontrolü
            if (!Enum.IsDefined(typeof(WorkStatus), status))
            {
                return BadRequest("Geçersiz durum kodu.");
            }

            var statusEnum = (WorkStatus)status;

            var result = await _service.UpdateStatusAsync(workOrderId, sectionId, status);
            if (result == null)
                return NotFound();

            string statusText = statusEnum switch
            {
                WorkStatus.Started => "başlatıldı",
                WorkStatus.Paused => "duraklatıldı",
                WorkStatus.Completed => "tamamlandı",
                _ => "güncellendi"
            };

            await _notificationService.SendNotificationAsync(
                title: "İş Durumu Güncellendi 🔄",
                icon: "📊",
                description: $"İş emri {workOrderId} için durum {statusText}.",
                color: "info"
            );

            return Ok(result);
        }


        [HttpPut("approval/{id}/{status}/{notes}")]
        public async Task<IActionResult> UpdateApproval(int id, int status, string notes)
        {
            if (!Enum.IsDefined(typeof(ApprovalStatus), status))
                return BadRequest("Geçersiz onay durumu.");

            var result = await _service.UpdateApprovalAsync(id, status, notes);
            if (result == null)
                return NotFound();

            var statusEnum = (ApprovalStatus)status;

            string statusText = statusEnum switch
            {
                ApprovalStatus.Approved => "onaylandı",
                ApprovalStatus.Rejected => "reddedildi",
                _ => "güncellendi"
            };

            await _notificationService.SendNotificationAsync(
                title: "Onay Durumu Güncellendi ✅",
                icon: "📝",
                description: $"İş emri {result.WorkOrderId} için onay durumu {statusText}.",
                color: statusEnum == ApprovalStatus.Approved ? "success" : "warning"
            );

            return Ok(result);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var assignment = await _service.GetAssignmentByIdAsync(id);
            if (assignment == null) return NotFound();

            await _service.DeleteAssignmentAsync(id);

            await _notificationService.SendNotificationAsync(
                title: "İş Ataması Silindi 🗑️",
                icon: "❌",
                description: $"İş emri {assignment.WorkOrderId} için atama silindi.",
                color: "warning"
            );

            return NoContent();
        }

        /// Tamamlanmamış tüm iş atamalarını durdurur.
        [HttpPost("pause-all")]
        public async Task<IActionResult> PauseAllExceptCompleted()
        {
            await _service.PauseAllExceptCompletedAsync();
            return Ok("Tamamlanmamış tüm iş atamaları duraklatıldı.");
        }

        /// Tamamlanmamış tüm iş atamalarını yeniden başlatır.
        [HttpPost("resume-all")]
        public async Task<IActionResult> ResumeAllExceptCompleted()
        {
            await _service.ResumeAllExceptCompletedAsync();
            return Ok("Tamamlanmamış tüm iş atamaları yeniden başlatıldı.");
        }
    }
}