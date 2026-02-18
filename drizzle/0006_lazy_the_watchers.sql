ALTER TABLE "groupMessages" ADD COLUMN "autoDeleteAt" timestamp;--> statement-breakpoint
ALTER TABLE "groupRooms" ADD COLUMN "autoDeleteDuration" integer;--> statement-breakpoint
ALTER TABLE "groupRooms" ADD COLUMN "isPremium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "autoDeleteAt" timestamp;--> statement-breakpoint
ALTER TABLE "userProfiles" ADD COLUMN "autoDeleteDuration" integer;--> statement-breakpoint
ALTER TABLE "userProfiles" ADD COLUMN "isPremium" boolean DEFAULT false NOT NULL;