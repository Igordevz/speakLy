-- CreateTable
CREATE TABLE "Audio" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "text_brute" TEXT NOT NULL,
    "name" TEXT,
    "resume" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Audio_id_key" ON "Audio"("id");
