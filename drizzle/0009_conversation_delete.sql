-- Add soft delete fields to conversations table
ALTER TABLE "conversations" ADD COLUMN "deletedByUser1" boolean DEFAULT false NOT NULL;
ALTER TABLE "conversations" ADD COLUMN "deletedByUser2" boolean DEFAULT false NOT NULL;
