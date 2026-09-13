// Eco Verify — schema do banco de dados (Drizzle ORM / PostgreSQL)
//
// ADAPTAÇÃO DE PLATAFORMA: a especificação original pede Supabase (Auth +
// Storage + RLS + RPC). Este sandbox roda Next.js (App Router) + PostgreSQL
// puro via Drizzle, sem Supabase disponível. Para preservar o espírito das
// regras de negócio (nada de lógica sensível só no cliente, operações
// atômicas, checagens no banco) todas as regras críticas foram portadas para:
//   - constraints/índices UNIQUE e CHECK no próprio schema (ver abaixo)
//   - funções PL/pgSQL SECURITY DEFINER no Postgres (ver src/db/sql/*.sql)
//     equivalentes a approve_submission / reject_submission / get_leaderboard
//   - um trigger BEFORE INSERT que aplica o rate limit de 5 submissões/dia
//     diretamente no banco (não apenas validação de formulário)
//   - autenticação por sessão em cookie httpOnly + checagem de role no
//     servidor (rotas /api/*), nunca confiando em dados vindos do cliente.
//
// Tabela `sessions` foi adicionada (não existe no schema original) para
// implementar autenticação própria já que não há Supabase Auth disponível.

import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["citizen", "moderator", "admin"]);

export const categoriaEnum = pgEnum("categoria", [
  "plantio",
  "doacao",
  "reciclagem",
  "mutirao",
  "outro",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pendente",
  "aprovada",
  "rejeitada",
]);

export const ledgerTipoEnum = pgEnum("ledger_tipo", ["credito", "ajuste"]);

export const rewardStatusEnum = pgEnum("reward_status", [
  "pendente",
  "em_processamento",
  "pago",
  "falhou",
]);

export const rewardRedeEnum = pgEnum("reward_rede", [
  "fone_nativo",
  "bep20_bsc",
]);

// profiles: equivalente a public.profiles (1:1 com auth.users no Supabase).
// Aqui também guarda password_hash pois não há Supabase Auth separado.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("citizen"),
  pontosTotais: integer("pontos_totais").notNull().default(0),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// sessions: substitui o mecanismo de sessão do Supabase Auth.
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    categoria: categoriaEnum("categoria").notNull(),
    pontosRecompensa: integer("pontos_recompensa").notNull(),
    foneRecompensaEstimado: numeric("fone_recompensa_estimado", {
      precision: 12,
      scale: 4,
    }).notNull(),
    ativa: boolean("ativa").notNull().default(true),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("missions_pontos_recompensa_check", sql`${table.pontosRecompensa} >= 0`),
    check(
      "missions_fone_recompensa_estimado_check",
      sql`${table.foneRecompensaEstimado} >= 0`,
    ),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "restrict" }),
    fotoUrl: text("foto_url").notNull(),
    // Anti-duplicata de foto: UNIQUE atômico e global no banco.
    fotoHash: text("foto_hash").notNull().unique(),
    relatorioTexto: text("relatorio_texto").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    status: submissionStatusEnum("status").notNull().default("pendente"),
    moderadorId: uuid("moderador_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    motivoRejeicao: text("motivo_rejeicao"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("submissions_status_idx").on(table.status),
    index("submissions_user_id_idx").on(table.userId),
    index("submissions_foto_hash_idx").on(table.fotoHash),
    check(
      "submissions_relatorio_texto_check",
      sql`char_length(${table.relatorioTexto}) >= 50`,
    ),
  ],
);

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "set null",
    }),
    pontos: integer("pontos").notNull(),
    tipo: ledgerTipoEnum("tipo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("points_ledger_user_id_idx").on(table.userId)],
);

export const rewardQueue = pgTable(
  "reward_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    valorFone: numeric("valor_fone", { precision: 12, scale: 4 }).notNull(),
    status: rewardStatusEnum("status").notNull().default("pendente"),
    txHash: text("tx_hash"),
    rede: rewardRedeEnum("rede").notNull().default("fone_nativo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reward_queue_user_id_idx").on(table.userId),
    index("reward_queue_status_idx").on(table.status),
    check("reward_queue_valor_fone_check", sql`${table.valorFone} >= 0`),
  ],
);
