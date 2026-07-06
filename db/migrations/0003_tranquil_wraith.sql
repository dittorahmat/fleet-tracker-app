ALTER TABLE "vehicles" ADD COLUMN "plate_number" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "vehicle_type" varchar(100);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "rent_status" varchar(50) DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "odometer" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "next_oil_change" double precision DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "tax_due_date" timestamp;