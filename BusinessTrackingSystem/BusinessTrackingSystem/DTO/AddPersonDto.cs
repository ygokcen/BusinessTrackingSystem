namespace Panopa.DTO;

public class AddPersonDto
{
    public string name { get; set; }
    public string surname { get; set; }

    public string phone_number { get; set; }
    public string e_mail { get; set; }

    public int s_id { get; set; } // sorumlu olduğu bölüm id 
    public int role { get; set; } // rol; 1 => yönetici 2 => işçi

    public string hash_pass { get; set; } // şifrelenmiş şifresi
}