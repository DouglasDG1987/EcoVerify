-- Eco Verify — funções e triggers do banco (equivalentes às RPCs SECURITY
-- DEFINER pedidas na especificação original em Supabase).
--
-- Adaptação: como este sandbox usa PostgreSQL puro (sem Supabase Auth/RLS
-- baseada em auth.uid()), as funções abaixo recebem o id do usuário
-- autenticado como parâmetro explícito. Esse id é resolvido pelo backend
-- Next.js a partir do cookie de sessão httpOnly assinado no servidor (nunca
-- confiado vindo do corpo da requisição do cliente para decidir permissões:
-- toda checagem de role/ownership é refeita aqui dentro, no banco).
--
-- Todas as funções são SECURITY DEFINER com SET search_path = public,
-- conforme exigido, para evitar search_path hijacking.

-- =========================================================================
-- Helpers de permissão (sem recursão: leem profiles ignorando policies)
-- =========================================================================
create or replace function is_admin(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = p_user and role = 'admin'
  );
$$;

create or replace function is_moderator_or_admin(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = p_user and role in ('moderator', 'admin')
  );
$$;

-- =========================================================================
-- Rate limit: máximo 5 submissões por usuário por dia (calendário).
-- Aplicado via trigger no banco, não apenas validação de formulário.
-- =========================================================================
create or replace function enforce_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from submissions
  where user_id = new.user_id
    and date_trunc('day', created_at) = date_trunc('day', now());

  if v_count >= 5 then
    raise exception 'rate_limit_exceeded: max 5 submissions per day' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_submission_rate_limit on submissions;
create trigger trg_submission_rate_limit
  before insert on submissions
  for each row
  execute function enforce_submission_rate_limit();

-- Impede que o próprio dono edite os campos de moderação de sua submissão
-- (equivalente ao WITH CHECK da policy de UPDATE do dono no Supabase):
-- qualquer tentativa de mudar status para algo != 'pendente', ou de setar
-- moderador_id/reviewed_at, fora das funções approve/reject abaixo, falha.
create or replace function guard_submission_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.bypass_submission_guard', true) = 'on' then
    return new;
  end if;

  if old.status <> 'pendente' then
    raise exception 'submission_locked: only pending submissions can be edited' using errcode = 'P0001';
  end if;

  if new.status is distinct from old.status
     or new.moderador_id is distinct from old.moderador_id
     or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'forbidden: cannot self-moderate a submission' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_submission_self_update on submissions;
create trigger trg_guard_submission_self_update
  before update on submissions
  for each row
  execute function guard_submission_self_update();

-- =========================================================================
-- updated_at automático para reward_queue
-- =========================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reward_queue_updated_at on reward_queue;
create trigger trg_reward_queue_updated_at
  before update on reward_queue
  for each row
  execute function set_updated_at();

-- =========================================================================
-- approve_submission: aprova uma submissão pendente de forma atômica.
-- =========================================================================
create or replace function approve_submission(p_submission uuid, p_moderator uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub submissions%rowtype;
  v_mission missions%rowtype;
begin
  if not is_moderator_or_admin(p_moderator) then
    return jsonb_build_object('ok', false, 'error', 'forbidden: not a moderator or admin');
  end if;

  select * into v_sub from submissions where id = p_submission for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'submission not found');
  end if;

  if v_sub.status <> 'pendente' then
    return jsonb_build_object('ok', false, 'error', 'submission is not pending');
  end if;

  if v_sub.user_id = p_moderator then
    return jsonb_build_object('ok', false, 'error', 'forbidden: cannot moderate your own submission');
  end if;

  select * into v_mission from missions where id = v_sub.mission_id;

  perform set_config('app.bypass_submission_guard', 'on', true);

  update submissions
     set status = 'aprovada',
         moderador_id = p_moderator,
         reviewed_at = now()
   where id = p_submission
     and status = 'pendente';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'submission is not pending');
  end if;

  perform set_config('app.bypass_submission_guard', 'off', true);

  insert into points_ledger (user_id, submission_id, pontos, tipo)
  values (v_sub.user_id, v_sub.id, v_mission.pontos_recompensa, 'credito');

  update profiles
     set pontos_totais = pontos_totais + v_mission.pontos_recompensa
   where id = v_sub.user_id;

  insert into reward_queue (user_id, submission_id, valor_fone, status, rede)
  values (v_sub.user_id, v_sub.id, v_mission.fone_recompensa_estimado, 'pendente', 'fone_nativo');

  return jsonb_build_object(
    'ok', true,
    'submission_id', v_sub.id,
    'pontos_creditados', v_mission.pontos_recompensa,
    'fone_enfileirado', v_mission.fone_recompensa_estimado
  );
end;
$$;

-- =========================================================================
-- reject_submission: rejeita uma submissão pendente com motivo obrigatório.
-- =========================================================================
create or replace function reject_submission(p_submission uuid, p_moderator uuid, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub submissions%rowtype;
begin
  if p_motivo is null or char_length(trim(p_motivo)) < 5 then
    return jsonb_build_object('ok', false, 'error', 'motivo de rejeicao deve ter ao menos 5 caracteres');
  end if;

  if not is_moderator_or_admin(p_moderator) then
    return jsonb_build_object('ok', false, 'error', 'forbidden: not a moderator or admin');
  end if;

  select * into v_sub from submissions where id = p_submission for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'submission not found');
  end if;

  if v_sub.status <> 'pendente' then
    return jsonb_build_object('ok', false, 'error', 'submission is not pending');
  end if;

  if v_sub.user_id = p_moderator then
    return jsonb_build_object('ok', false, 'error', 'forbidden: cannot moderate your own submission');
  end if;

  perform set_config('app.bypass_submission_guard', 'on', true);

  update submissions
     set status = 'rejeitada',
         moderador_id = p_moderator,
         reviewed_at = now(),
         motivo_rejeicao = p_motivo
   where id = p_submission
     and status = 'pendente';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'submission is not pending');
  end if;

  perform set_config('app.bypass_submission_guard', 'off', true);

  return jsonb_build_object('ok', true, 'submission_id', v_sub.id);
end;
$$;

-- =========================================================================
-- get_leaderboard: ranking público, nunca expõe email/wallet_address.
-- =========================================================================
create or replace function get_leaderboard(p_limit int default 20)
returns table(id uuid, nome text, pontos_totais integer)
language sql
security definer
stable
set search_path = public
as $$
  select id, nome, pontos_totais
  from profiles
  order by pontos_totais desc, created_at asc
  limit least(greatest(p_limit, 1), 100);
$$;
