ALTER TABLE "location_logs" ADD COLUMN "acc_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "location_logs" ADD COLUMN "relay_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "location_logs" ADD COLUMN "battery_level" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "acc_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "relay_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "battery_level" integer DEFAULT 100 NOT NULL;