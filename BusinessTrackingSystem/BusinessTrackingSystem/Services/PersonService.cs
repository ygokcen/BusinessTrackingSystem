using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Panopa.Data;
using Panopa.DTO;
using Panopa.Interfaces;
using Panopa.Models;

namespace Panopa.Services
{
    public class PersonService : IPersonService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly int _personId;

        public PersonService(AppDbContext context,  IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            
            // JWT'den CompanyId'yi al
            var personIdClain = _httpContextAccessor.HttpContext?.User?.FindFirst("PersonId");
            if (personIdClain != null && int.TryParse(personIdClain.Value, out int personId))
            {
                _personId = personId;
            }
        }
        
        public async Task<IEnumerable<Person>> GetAllPersonsAsync()
        {
            return await _context.Persons.ToListAsync();
        }

        public async Task<Person?> GetPersonByIdAsync(int id)
        {
            return await _context.Persons.FindAsync(id);
        }

        public async Task<Person?> GetPersonByPhoneNumberAsync(string phoneNumber)
        {
            return await _context.Persons.FirstOrDefaultAsync(p => p.PhoneNumber == phoneNumber);
        }

        public async Task<Person> CreatePersonAsync(AddPersonDto personDto)
        {
            var person = new Person
            {
                Name = personDto.name,
                Surname = personDto.surname,
                PhoneNumber = personDto.phone_number,
                Email = personDto.e_mail,
                SectionId = personDto.s_id,
                Role = (PersonRole)personDto.role,
                HashedPassword = BCrypt.Net.BCrypt.HashPassword(personDto.hash_pass)
            };

            _context.Persons.Add(person);
            await _context.SaveChangesAsync();
            return person;
        }

        public async Task<Person> UpdatePersonAsync(Person person)
        {
            _context.Persons.Update(person);
            await _context.SaveChangesAsync();
            return person;
        }

        public async Task DeletePersonAsync(int id)
        {
            var person = await _context.Persons.FindAsync(id);
            if (person != null)
            {
                _context.Persons.Remove(person);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Person?> GetSessionInAuth()
        {
            if (_personId == 0)
                return null;

            return await _context.Persons
                .Include(p => p.Section)
                .FirstOrDefaultAsync(p => p.Id == _personId);
        }
    }
}