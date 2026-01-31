-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT NOT NULL,
    "preferredLangs" TEXT NOT NULL,
    "minExperience" INTEGER NOT NULL DEFAULT 1,
    "culture" TEXT
);
