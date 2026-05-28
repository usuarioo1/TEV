-- CreateTable
CREATE TABLE "TractoCamion" (
    "id" SERIAL NOT NULL,
    "patente" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "año" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TractoCamion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semiremolque" (
    "id" SERIAL NOT NULL,
    "patente" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "año" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semiremolque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TractoCamion_patente_key" ON "TractoCamion"("patente");

-- CreateIndex
CREATE UNIQUE INDEX "Semiremolque_patente_key" ON "Semiremolque"("patente");
