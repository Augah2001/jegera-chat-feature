/*
  Warnings:

  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ChatId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `sentbByMe` on the `Message` table. All the data in the column will be lost.
  - Added the required column `id` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sentByMe` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ChatToUser" DROP CONSTRAINT "_ChatToUser_A_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_pkey",
DROP COLUMN "ChatId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "sentbByMe",
ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "sentByMe" BOOLEAN NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
