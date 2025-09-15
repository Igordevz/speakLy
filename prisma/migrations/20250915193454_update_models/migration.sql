/*
  Warnings:

  - Added the required column `duration` to the `Audio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_name` to the `Audio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `Audio` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Audio" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "text_brute" TEXT,
    "name" TEXT,
    "resume" TEXT,
    "userId" TEXT,
    "file_size" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Audio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Audio" ("id", "name", "reference", "resume", "text_brute", "userId") SELECT "id", "name", "reference", "resume", "text_brute", "userId" FROM "Audio";
DROP TABLE "Audio";
ALTER TABLE "new_Audio" RENAME TO "Audio";
CREATE UNIQUE INDEX "Audio_id_key" ON "Audio"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
