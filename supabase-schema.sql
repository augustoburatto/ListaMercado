-- ============================================================
--  Carrinho — estrutura do banco
--  Cole tudo isso no SQL Editor do Supabase e clique em Run.
--  Roda uma vez só. Pode rodar de novo sem quebrar nada.
-- ============================================================

-- ---------- Itens da lista ----------
create table if not exists public.itens (
  id          uuid primary key default gen_random_uuid(),
  nome        text        not null,
  quantidade  numeric     not null default 1,
  preco       numeric     not null default 0,
  comprado    boolean     not null default false,
  criado_em   timestamptz not null default now()
);

-- ---------- Nome da lista (e qualquer outro ajuste futuro) ----------
create table if not exists public.config (
  chave text primary key,
  valor text
);

insert into public.config (chave, valor)
values ('titulo', 'Lista da casa')
on conflict (chave) do nothing;


-- ============================================================
--  Permissões
--  A lista é pública de propósito: quem tem o link lê e escreve.
--  Se um dia quiser fechar, é aqui que se mexe.
-- ============================================================

alter table public.itens  enable row level security;
alter table public.config enable row level security;

-- limpa políticas antigas para o script poder rodar de novo
drop policy if exists "itens_leitura_publica"  on public.itens;
drop policy if exists "itens_escrita_publica"  on public.itens;
drop policy if exists "config_leitura_publica" on public.config;
drop policy if exists "config_escrita_publica" on public.config;

create policy "itens_leitura_publica"
  on public.itens for select
  to anon, authenticated
  using (true);

create policy "itens_escrita_publica"
  on public.itens for all
  to anon, authenticated
  using (true) with check (true);

create policy "config_leitura_publica"
  on public.config for select
  to anon, authenticated
  using (true);

create policy "config_escrita_publica"
  on public.config for all
  to anon, authenticated
  using (true) with check (true);


-- ---------- Índice para ordenar rápido ----------
create index if not exists itens_criado_em_idx on public.itens (criado_em);
