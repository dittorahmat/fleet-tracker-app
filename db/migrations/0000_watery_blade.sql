CREATE TABLE "location_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(256) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"speed" double precision NOT NULL,
	"heading" double precision NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;