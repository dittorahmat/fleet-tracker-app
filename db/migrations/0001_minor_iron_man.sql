CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(256) NOT NULL,
	"type" varchar(100) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"severity" varchar(50) DEFAULT 'low' NOT NULL,
	"timestamp" timestamp NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"center_latitude" double precision NOT NULL,
	"center_longitude" double precision NOT NULL,
	"radius_meters" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;