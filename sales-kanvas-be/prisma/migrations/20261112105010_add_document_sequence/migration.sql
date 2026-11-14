-- CreateTable
CREATE TABLE "document_sequence" (
    "id" SERIAL NOT NULL,
    "prefix" TEXT NOT NULL,
    "date_key" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_sequence_prefix_date_key_key" ON "document_sequence"("prefix", "date_key");
