-- DropIndex
DROP INDEX "public"."GroupMessage_roomId_idx";

-- CreateTable
CREATE TABLE "MessageSeen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageSeen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageSeen_messageId_idx" ON "MessageSeen"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageSeen_userId_messageId_key" ON "MessageSeen"("userId", "messageId");

-- AddForeignKey
ALTER TABLE "MessageSeen" ADD CONSTRAINT "MessageSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSeen" ADD CONSTRAINT "MessageSeen_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "GroupMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
