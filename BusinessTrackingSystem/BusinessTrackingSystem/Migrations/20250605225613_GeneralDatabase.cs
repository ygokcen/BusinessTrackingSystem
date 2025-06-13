using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Panopa.Migrations
{
    /// <inheritdoc />
    public partial class GeneralDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SectionWorkAssignments_PersonId",
                table: "SectionWorkAssignments",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_SectionWorkAssignments_SectionId",
                table: "SectionWorkAssignments",
                column: "SectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_SectionWorkAssignments_Persons_PersonId",
                table: "SectionWorkAssignments",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SectionWorkAssignments_Sections_SectionId",
                table: "SectionWorkAssignments",
                column: "SectionId",
                principalTable: "Sections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SectionWorkAssignments_Persons_PersonId",
                table: "SectionWorkAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_SectionWorkAssignments_Sections_SectionId",
                table: "SectionWorkAssignments");

            migrationBuilder.DropIndex(
                name: "IX_SectionWorkAssignments_PersonId",
                table: "SectionWorkAssignments");

            migrationBuilder.DropIndex(
                name: "IX_SectionWorkAssignments_SectionId",
                table: "SectionWorkAssignments");
        }
    }
}
