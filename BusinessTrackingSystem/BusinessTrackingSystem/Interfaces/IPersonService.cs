using System.Threading.Tasks;
using Panopa.DTO;
using Panopa.Models;

namespace Panopa.Interfaces
{
    public interface IPersonService
    {
        Task<IEnumerable<Person>> GetAllPersonsAsync();
        Task<Person?> GetPersonByIdAsync(int id);
        Task<Person?> GetPersonByPhoneNumberAsync(string phoneNumber);
        Task<Person> CreatePersonAsync(AddPersonDto personDto);
        Task<Person> UpdatePersonAsync(Person person);
        Task DeletePersonAsync(int id);
        Task<Person?> GetSessionInAuth();
    }
}