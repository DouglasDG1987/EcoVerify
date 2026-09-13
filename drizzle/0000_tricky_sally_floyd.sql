CREATE TYPE "public"."categoria" AS ENUM('plantio', 'doacao', 'reciclagem', 'mutirao', 'outro');--> statement-breakpoint
CREATE TYPE "public"."ledger_tipo" AS ENUM('credito', 'ajuste');--> statement-breakpoint
CREATE TYPE "public"."reward_rede" AS ENUM('fone_nativo', 'bep20_bsc');--> statement-breakpoint
CREATE TYPE "public"."reward_status" AS ENUM('pendente', 'em_processamento', 'pago', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('citizen', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pendente', 'aprovada', 'rejeitada');--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text NOT NULL,
	"categoria" "categoria" NOT NULL,
	"pontos_recompensa" integer NOT NULL,
	"fone_recompensa_estimado" numeric(12, 4) NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missions_pontos_recompensa_check" CHECK ("missions"."pontos_recompensa" >= 0),
	CONSTRAINT "missions_fone_recompensa_estimado_check" CHECK ("missions"."fone_recompensa_estimado" >= 0)
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"submission_id" uuid,
	"pontos" integer NOT NULL,
	"tipo" "ledger_tipo" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'citizen' NOT NULL,
	"pontos_totais" integer DEFAULT 0 NOT NULL,
	"wallet_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reward_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"valor_fone" numeric(12, 4) NOT NULL,
	"status" "reward_status" DEFAULT 'pendente' NOT NULL,
	"tx_hash" text,
	"rede" "reward_rede" DEFAULT 'fone_nativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reward_queue_valor_fone_check" CHECK ("reward_queue"."valor_fone" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"foto_url" text NOT NULL,
	"foto_hash" text NOT NULL,
	"relatorio_texto" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"status" "submission_status" DEFAULT 'pendente' NOT NULL,
	"moderador_id" uuid,
	"motivo_rejeicao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "submissions_foto_hash_unique" UNIQUE("foto_hash"),
	CONSTRAINT "submissions_relatorio_texto_check" CHECK (char_length("submissions"."relatorio_texto") >= 50)
);
--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_queue" ADD CONSTRAINT "reward_queue_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_queue" ADD CONSTRAINT "reward_queue_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_moderador_id_profiles_id_fk" FOREIGN KEY ("moderador_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "points_ledger_user_id_idx" ON "points_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reward_queue_user_id_idx" ON "reward_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reward_queue_status_idx" ON "reward_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_user_id_idx" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_foto_hash_idx" ON "submissions" USING btree ("foto_hash");