using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Panopa.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonSectionNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "SectionId",
                table: "Persons",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_SectionId",
                table: "Persons",
                column: "SectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Persons_Sections_SectionId",
                table: "Persons",
                column: "SectionId",
                principalTable: "Sections",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Persons_Sections_SectionId",
                table: "Persons");

            migrationBuilder.DropIndex(
                name: "IX_Persons_SectionId",
                table: "Persons");

            migrationBuilder.AlterColumn<int>(
                name: "SectionId",
                table: "Persons",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
