using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Panopa.Models;
using Panopa.Interfaces;

namespace Panopa.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SessionLogsController : ControllerBase
    {
        private readonly ISessionLogService _sessionLogService;

        public SessionLogsController(ISessionLogService sessionLogService)
        {
            _sessionLogService = sessionLogService;
        }

        [HttpGet]
        public async Task<ActionResult<List<SessionLog>>> GetAll()
        {
            var logs = await _sessionLogService.GetAllAsync();
            return Ok(logs);
        }

        [HttpGet("byWorkOrder/{workOrderId}")]
        public async Task<ActionResult<List<SessionLog>>> GetByWorkOrderId(string workOrderId)
        {
            var logs = await _sessionLogService.GetByWorkOrderIdAsync(workOrderId);
            return Ok(logs);
        }

        [HttpGet("byPerson/{personId}")]
        public async Task<ActionResult<List<SessionLog>>> GetByPersonId(int personId)
        {
            var logs = await _sessionLogService.GetByPersonIdAsync(personId);
            return Ok(logs);
        }

        [HttpGet("bySection/{sectionId}")]
        public async Task<ActionResult<List<SessionLog>>> GetBySectionId(int sectionId)
        {
            var logs = await _sessionLogService.GetBySectionIdAsync(sectionId);
            return Ok(logs);
        }
    }
}