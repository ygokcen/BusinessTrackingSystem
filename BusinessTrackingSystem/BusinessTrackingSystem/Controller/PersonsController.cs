using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Panopa.Interfaces;
using Panopa.Models;
using Panopa.DTO;

namespace Panopa.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PersonsController : ControllerBase
    {
        private readonly IPersonService _personService;
        private readonly INotificationService _notificationService;

        public PersonsController(IPersonService personService, INotificationService notificationService)
        {
            _personService = personService;
            _notificationService = notificationService;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Person>>> GetAll()
        {
            var persons = await _personService.GetAllPersonsAsync();
            return Ok(persons);
        }
        
        [HttpGet("user-info")]
        public async Task<IActionResult> GetSessionPerson()
        {
            var person = await _personService.GetSessionInAuth();
    
            if (person == null)
                return Unauthorized("Oturum bilgisi bulunamadı.");

            return Ok(person);
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddPersonDto personDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdPerson = await _personService.CreatePersonAsync(personDto);
            
            await _notificationService.SendNotificationAsync(
                title: "Yeni Personel Eklendi 👤",
                icon: "➕",
                description: $"{createdPerson.Name} {createdPerson.Surname} sisteme eklendi.",
                color: "success"
            );
            
            return CreatedAtAction(nameof(GetById), new { id = createdPerson.Id }, createdPerson);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var person = await _personService.GetPersonByIdAsync(id);
            if (person == null)
                return NotFound();

            return Ok(person);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Person person)
        {
            if (id != person.Id)
                return BadRequest("Id uyuşmuyor.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updatedPerson = await _personService.UpdatePersonAsync(person);
            if (updatedPerson == null)
                return NotFound();

            await _notificationService.SendNotificationAsync(
                title: "Personel Bilgileri Güncellendi 🔄",
                icon: "📝",
                description: $"{person.Name} {person.Surname} bilgileri güncellendi.",
                color: "info"
            );

            return Ok("success");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var person = await _personService.GetPersonByIdAsync(id);
            if (person == null)
                return NotFound();

            await _personService.DeletePersonAsync(id);

            await _notificationService.SendNotificationAsync(
                title: "Personel Silindi 🗑️",
                icon: "❌",
                description: $"{person.Name} {person.Surname} sistemden silindi.",
                color: "warning"
            );

            return Ok("success");
        }
    }
}