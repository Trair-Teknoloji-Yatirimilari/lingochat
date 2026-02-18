CREATE TABLE "meetingSummaries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meetingSummaries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"roomId" integer NOT NULL,
	"generatedBy" integer NOT NULL,
	"messageCount" integer NOT NULL,
	"participantCount" integer NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"summaryData" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
