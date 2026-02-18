ALTER TABLE "mediaMessages" ALTER COLUMN "mediaUrl" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mediaMessages" ALTER COLUMN "cloudinaryPublicId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mediaMessages" ADD COLUMN "latitude" varchar(50);--> statement-breakpoint
ALTER TABLE "mediaMessages" ADD COLUMN "longitude" varchar(50);--> statement-breakpoint
ALTER TABLE "mediaMessages" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "mediaMessages" ADD COLUMN "contactName" varchar(255);--> statement-breakpoint
ALTER TABLE "mediaMessages" ADD COLUMN "contactPhone" varchar(50);