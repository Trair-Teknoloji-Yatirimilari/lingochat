ALTER TABLE "groupMessages" ADD COLUMN "clientMessageId" varchar(36);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "clientMessageId" varchar(36);--> statement-breakpoint
ALTER TABLE "groupMessages" ADD CONSTRAINT "groupMessages_clientMessageId_unique" UNIQUE("clientMessageId");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_clientMessageId_unique" UNIQUE("clientMessageId");--> statement-breakpoint
CREATE INDEX "idx_messages_client_message_id" ON "messages" ("clientMessageId");--> statement-breakpoint
CREATE INDEX "idx_group_messages_client_message_id" ON "groupMessages" ("clientMessageId");