create extension if not exists "pgcrypto";

create type member_role as enum ('owner', 'member', 'viewer');
create type workspace_type as enum ('personal', 'team');
create type time_cycle as enum ('daily', 'weekly', 'monthly');
create type bujo_symbol_type as enum ('task', 'completed', 'migrated', 'priority');
create type card_visibility as enum ('private', 'shared');
create type card_bucket as enum ('week', 'month');

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace',
  type workspace_type not null default 'personal',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  name text,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  cycle time_cycle not null default 'weekly',
  target_date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  bujo_symbol bujo_symbol_type not null default 'task',
  title text not null,
  progress smallint not null default 0 check (progress between 0 and 100),
  visibility card_visibility not null default 'private',
  bucket card_bucket not null default 'week',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table card_checklist_items (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table card_assignees (
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (card_id, user_id)
);

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_workspaces_updated_at before update on workspaces
  for each row execute procedure set_updated_at();
create trigger trg_projects_updated_at before update on projects
  for each row execute procedure set_updated_at();
create trigger trg_cards_updated_at before update on cards
  for each row execute procedure set_updated_at();

-- Auto-provision a personal workspace + default "Inbox" project on signup,
-- so Sprint 1 never needs a "create workspace" UI.
create function handle_new_user() returns trigger as $$
declare
  new_workspace_id uuid;
begin
  insert into workspaces (name, type, owner_id)
    values ('My Workspace', 'personal', new.id)
    returning id into new_workspace_id;

  insert into workspace_members (workspace_id, user_id, role, name)
    values (new_workspace_id, new.id, 'owner', new.email);

  insert into projects (workspace_id, title, cycle)
    values (new_workspace_id, 'Inbox', 'weekly');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;
alter table cards enable row level security;
alter table card_checklist_items enable row level security;
alter table card_assignees enable row level security;

create policy "member can read own workspace" on workspaces
  for select using (
    exists (select 1 from workspace_members wm where wm.workspace_id = id and wm.user_id = auth.uid())
  );
create policy "owner can update workspace" on workspaces
  for update using (owner_id = auth.uid());

create policy "member can read own membership rows" on workspace_members
  for select using (
    exists (select 1 from workspace_members wm2 where wm2.workspace_id = workspace_id and wm2.user_id = auth.uid())
  );

create policy "member can CRUD projects in own workspace" on projects
  for all using (
    exists (select 1 from workspace_members wm where wm.workspace_id = projects.workspace_id and wm.user_id = auth.uid())
  );

create policy "member can CRUD cards in own workspace" on cards
  for all using (
    exists (
      select 1 from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = cards.project_id and wm.user_id = auth.uid()
    )
  );

create policy "member can CRUD checklist items in own workspace" on card_checklist_items
  for all using (
    exists (
      select 1 from cards c
      join projects p on p.id = c.project_id
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where c.id = card_checklist_items.card_id and wm.user_id = auth.uid()
    )
  );

create policy "member can CRUD assignees in own workspace" on card_assignees
  for all using (
    exists (
      select 1 from cards c
      join projects p on p.id = c.project_id
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where c.id = card_assignees.card_id and wm.user_id = auth.uid()
    )
  );
