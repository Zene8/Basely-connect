/*
  Warnings:

  - The primary key for the `Company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `culture` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `minExperience` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLangs` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `requiredSkills` on the `Company` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Company` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `contributions` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frameworks` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `languages` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skills` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "githubHandle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL DEFAULT '🏢',
    "color" TEXT NOT NULL DEFAULT '#888888',
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "frameworks" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "contributions" TEXT NOT NULL
);
INSERT INTO "new_Company" ("description", "id", "industry", "name") SELECT "description", "id", "industry", "name" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
