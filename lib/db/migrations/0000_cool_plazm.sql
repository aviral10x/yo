CREATE TYPE "public"."booking_status" AS ENUM('provisional', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."calendar_block_kind" AS ENUM('hold', 'confirmed', 'blackout');--> statement-breakpoint
CREATE TYPE "public"."conversation_channel" AS ENUM('whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('wedding', 'reception', 'sangeet', 'mehndi', 'haldi', 'engagement', 'birthday', 'corporate', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('direct', 'whatsapp', 'wedmegood', 'weddingz', 'venuelook', 'walkin', 'referral', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('new', 'qualified', 'site_visit', 'quoted', 'hold', 'deposit', 'confirmed', 'lost');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'hi');--> statement-breakpoint
CREATE TYPE "public"."media_category" AS ENUM('entrance', 'lawn_wide', 'stage', 'buffet', 'bridal_room', 'guest_room', 'parking', 'washroom', 'lighting', 'rain_backup', 'team', 'live_event', 'other');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('deposit', 'installment', 'final');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('starter', 'growth', 'portfolio');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('google', 'direct');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'manager', 'staff');--> statement-breakpoint
CREATE TYPE "public"."site_visit_status" AS ENUM('scheduled', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."space_kind" AS ENUM('lawn', 'hall', 'room_block', 'combo');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'cancelled', 'paused');--> statement-breakpoint
CREATE TYPE "public"."vendor_category" AS ENUM('photographer', 'caterer', 'decorator', 'makeup', 'music', 'other');--> statement-breakpoint
CREATE TYPE "public"."venue_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('lawn', 'banquet', 'resort', 'farmhouse', 'hotel');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"venue_id" uuid,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_name" text,
	"city" text,
	"input_url" text,
	"contact_phone" text,
	"scores" jsonb DEFAULT '{}'::jsonb,
	"mock_page_url" text,
	"shared_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"lead_id" uuid,
	"status" "booking_status" DEFAULT 'provisional' NOT NULL,
	"event_type" "event_type" DEFAULT 'wedding',
	"event_date" date NOT NULL,
	"space_ids" jsonb DEFAULT '[]'::jsonb,
	"hold_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"date" date NOT NULL,
	"kind" "calendar_block_kind" DEFAULT 'hold' NOT NULL,
	"booking_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lead_id" uuid,
	"channel" "conversation_channel" DEFAULT 'whatsapp' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"role" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"timeline" jsonb DEFAULT '[]'::jsonb,
	"menu" jsonb DEFAULT '{}'::jsonb,
	"decor_notes" text,
	"rooming_list" jsonb DEFAULT '{}'::jsonb,
	"day_sheet_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"couple_name" text,
	"phone" text,
	"email" text,
	"source" "lead_source" DEFAULT 'direct' NOT NULL,
	"event_type" "event_type" DEFAULT 'wedding',
	"date_requested" date,
	"dates_flexible" jsonb DEFAULT '[]'::jsonb,
	"guest_count" integer,
	"stage" "lead_stage" DEFAULT 'new' NOT NULL,
	"lost_reason" text,
	"score" integer,
	"assigned_user_id" uuid,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"url" text NOT NULL,
	"kind" "media_kind" DEFAULT 'photo' NOT NULL,
	"category" "media_category" DEFAULT 'other' NOT NULL,
	"ai_tags" jsonb DEFAULT '[]'::jsonb,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" "message_direction" NOT NULL,
	"body" text,
	"ai_draft" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text,
	"name" text NOT NULL,
	"plan" "plan" DEFAULT 'starter' NOT NULL,
	"billing_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"event_types" jsonb DEFAULT '[]'::jsonb,
	"inclusions" jsonb DEFAULT '[]'::jsonb,
	"price_min" numeric,
	"price_max" numeric,
	"per_plate" numeric,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"type" "payment_type" DEFAULT 'deposit' NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"razorpay_payment_link_id" text,
	"razorpay_payment_id" text,
	"due_date" date,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"package_id" uuid,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" numeric,
	"taxes" numeric,
	"total" numeric,
	"valid_until" date,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"author" text,
	"rating" integer,
	"text" text,
	"source" "review_source" DEFAULT 'direct' NOT NULL,
	"response" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "site_visit_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "space_kind" DEFAULT 'lawn' NOT NULL,
	"seated_capacity" integer,
	"floating_capacity" integer,
	"room_count" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan" "plan" DEFAULT 'starter' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"razorpay_subscription_id" text,
	"current_period_end" timestamp with time zone,
	"addons" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"name" text,
	"email" text,
	"phone" text,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "vendor_category" DEFAULT 'other' NOT NULL,
	"contact" text,
	"preferred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"type" "venue_type" DEFAULT 'lawn' NOT NULL,
	"status" "venue_status" DEFAULT 'draft' NOT NULL,
	"city" text,
	"state" text,
	"address_line" text,
	"lat" numeric,
	"lng" numeric,
	"google_place_id" text,
	"story" text,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "website_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"template_id" text DEFAULT 'classic' NOT NULL,
	"theme_config" jsonb DEFAULT '{}'::jsonb,
	"blocks" jsonb DEFAULT '{}'::jsonb,
	"seo_meta" jsonb DEFAULT '{}'::jsonb,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "website_configs_venue_id_unique" UNIQUE("venue_id")
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_blocks" ADD CONSTRAINT "calendar_blocks_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendors" ADD CONSTRAINT "event_vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendors" ADD CONSTRAINT "event_vendors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendors" ADD CONSTRAINT "event_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_configs" ADD CONSTRAINT "website_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_configs" ADD CONSTRAINT "website_configs_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_org_created_idx" ON "activity_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_venue_idx" ON "activity_events" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "bookings_org_idx" ON "bookings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bookings_venue_idx" ON "bookings" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "bookings_org_date_idx" ON "bookings" USING btree ("organization_id","event_date");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_space_date_uq" ON "calendar_blocks" USING btree ("space_id","date");--> statement-breakpoint
CREATE INDEX "calendar_org_idx" ON "calendar_blocks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "calendar_venue_date_idx" ON "calendar_blocks" USING btree ("venue_id","date");--> statement-breakpoint
CREATE INDEX "conversations_org_idx" ON "conversations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversations_lead_idx" ON "conversations" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_vendor_uq" ON "event_vendors" USING btree ("event_id","vendor_id");--> statement-breakpoint
CREATE INDEX "event_vendors_org_idx" ON "event_vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "events_org_idx" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "leads_org_idx" ON "leads" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "leads_venue_idx" ON "leads" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "leads_org_stage_idx" ON "leads" USING btree ("organization_id","stage");--> statement-breakpoint
CREATE INDEX "media_org_idx" ON "media_assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "media_venue_idx" ON "media_assets" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_uq" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_org_idx" ON "messages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "packages_org_idx" ON "packages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "packages_venue_idx" ON "packages" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "payments_org_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "quotes_org_idx" ON "quotes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "quotes_lead_idx" ON "quotes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "reviews_org_idx" ON "reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reviews_venue_idx" ON "reviews" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "site_visits_org_idx" ON "site_visits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "site_visits_lead_idx" ON "site_visits" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "spaces_org_idx" ON "spaces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "spaces_venue_idx" ON "spaces" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "vendors_org_idx" ON "vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendors_venue_idx" ON "vendors" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_slug_uq" ON "venues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "venues_org_idx" ON "venues" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "website_configs_org_idx" ON "website_configs" USING btree ("organization_id");