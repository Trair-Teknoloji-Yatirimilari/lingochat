CREATE TABLE "groupMediaMessages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupMediaMessages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"messageId" integer NOT NULL,
	"roomId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"mediaType" varchar(20) NOT NULL,
	"mediaUrl" text,
	"cloudinaryPublicId" varchar(255),
	"fileName" varchar(255),
	"fileSize" integer,
	"mimeType" varchar(100),
	"latitude" varchar(50),
	"longitude" varchar(50),
	"address" text,
	"contactName" varchar(255),
	"contactPhone" varchar(50),
	"caption" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
