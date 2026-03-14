-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PENDING', 'PLAYER_O_WINS', 'PLAYER_X_WINS', 'DRAW');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Games" (
    "id" TEXT NOT NULL,
    "player_O" TEXT NOT NULL,
    "player_X" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Games_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_player_O_fkey" FOREIGN KEY ("player_O") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_player_X_fkey" FOREIGN KEY ("player_X") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
