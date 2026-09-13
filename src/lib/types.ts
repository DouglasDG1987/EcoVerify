// Tipos compartilhados entre client/server, espelhando o schema do banco
// (src/db/schema.ts). Mantidos em sincronia manualmente.

export type Role = "citizen" | "moderator" | "admin";

export type MissionCategoria =
  | "plantio"
  | "doacao"
  | "reciclagem"
  | "mutirao"
  | "outro";

export type SubmissionStatus = "pendente" | "aprovada" | "rejeitada";

export type LedgerTipo = "credito" | "ajuste";

export type RewardStatus = "pendente" | "em_processamento" | "pago" | "falhou";

export type RewardRede = "fone_nativo" | "bep20_bsc";

export interface PublicProfile {
  id: string;
  nome: string;
  role: Role;
  pontosTotais: number;
  walletAddress: string | null;
  createdAt: string;
}

export interface SessionUser extends PublicProfile {
  email: string;
}

export interface Mission {
  id: string;
  titulo: string;
  descricao: string;
  categoria: MissionCategoria;
  pontosRecompensa: number;
  foneRecompensaEstimado: string;
  ativa: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  missionId: string;
  fotoUrl: string;
  fotoHash: string;
  relatorioTexto: string;
  lat: number | null;
  lng: number | null;
  status: SubmissionStatus;
  moderadorId: string | null;
  motivoRejeicao: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface SubmissionWithRelations extends Submission {
  mission?: Pick<Mission, "id" | "titulo" | "categoria" | "pontosRecompensa" | "foneRecompensaEstimado">;
  autor?: Pick<PublicProfile, "id" | "nome">;
}

export interface LeaderboardEntry {
  id: string;
  nome: string;
  pontosTotais: number;
}

export interface RewardQueueItem {
  id: string;
  userId: string;
  submissionId: string;
  valorFone: string;
  status: RewardStatus;
  txHash: string | null;
  rede: RewardRede;
  createdAt: string;
  updatedAt: string;
  usuarioNome?: string;
}

export interface AdminMetrics {
  pendentes: number;
  aprovadas: number;
  rejeitadas: number;
  taxaAprovacao: number;
  pontosDistribuidos: number;
  totalUsuarios: number;
  foneParado: number;
  fonePago: number;
  ranking: LeaderboardEntry[];
}

export interface ApiOk<T = Record<string, never>> {
  ok: true;
  [key: string]: unknown;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResult<T = Record<string, never>> = (ApiOk & T) | ApiError;
