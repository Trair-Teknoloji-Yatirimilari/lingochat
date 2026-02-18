CREATE TABLE "groupMessageTranslations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupMessageTranslations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"messageId" integer NOT NULL,
	"targetLanguage" varchar(10) NOT NULL,
	"translatedText" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupMessages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupMessages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"roomId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"originalText" text NOT NULL,
	"originalLanguage" varchar(10) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupParticipants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupParticipants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"roomId" integer NOT NULL,
	"userId" integer NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"leftAt" timestamp,
	"isModerator" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupRooms" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groupRooms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" text,
	"creatorId" integer NOT NULL,
	"roomCode" varchar(6) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"maxParticipants" integer DEFAULT 50 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groupRooms_roomCode_unique" UNIQUE("roomCode")
);
