ALTER TABLE "userProfiles" ADD COLUMN "showReadReceipts" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "userProfiles" ADD COLUMN "showOnlineStatus" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "userProfiles" ADD COLUMN "showProfilePhoto" boolean DEFAULT true NOT NULL;