-- Flattens the workspace -> project -> card indirection down to a direct
-- owner_id on cards, per the revised schema design. Solo mode no longer
-- needs a "project" to hang a card off of -- a card belongs directly to its
-- owner, carries its own time_frame/target_date, and workspace_id stays as
-- a nullable FK for the future Team-mode "share to workspace" path.

alter type bujo_symbol_type add value if not exists 'note';

alter table cards add column owner_id uuid references auth.users(id) on delete cascade;
alter table cards add column workspace_id uuid references workspaces(id) on delete set null;
alter table cards add column content text;
alter table cards add column time_frame text;
alter table cards add column target_date date;
alter table cards add column progress_percent smallint;

-- Backfill from the project/workspace chain before that chain is dropped.
-- workspace_id carries over too, so cards already marked 'shared' keep
-- being visible to the same teammates under the new direct-FK policy below.
update cards c
set owner_id = w.owner_id,
    workspace_id = w.id,
    time_frame = case c.bucket
      when 'daily' then 'daily'
      when 'week' then 'weekly'
      when 'month' then 'monthly'
      when 'future' then 'future'
    end,
    progress_percent = c.progress
from projects p
join workspaces w on w.id = p.workspace_id
where p.id = c.project_id;

alter table cards alter column owner_id set not null;

alter table cards alter column time_frame set default 'daily';
alter table cards alter column time_frame set not null;
alter table cards add constraint cards_time_frame_check
  check (time_frame in ('daily', 'weekly', 'monthly', 'future'));

alter table cards alter column progress_percent set default 0;
alter table cards alter column progress_percent set not null;
alter table cards add constraint cards_progress_percent_check
  check (progress_percent between 0 and 100);

-- RLS must be rewired off owner_id/workspace_id *before* project_id is
-- dropped below -- the old policies still reference it (directly on cards,
-- and via a join through cards on the two child tables), so Postgres
-- refuses the column drop while they exist (error 2BP01).

-- Non-recursive helper so RLS policies can check workspace membership
-- without re-triggering workspace_members' own policy (see 0002's note on
-- the infinite-recursion bug this avoids).
create or replace function public.user_workspaces()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select workspace_id from public.workspace_members where user_id = auth.uid();
$$;

-- cards RLS: owner always has full CRUD over their own cards regardless of
-- visibility; teammates get read-only access to cards explicitly shared to
-- a workspace they belong to.
drop policy if exists "member can CRUD cards in own workspace" on cards;

create policy "owner can CRUD own cards" on cards
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "team members can view shared cards" on cards
  for select using (
    visibility = 'shared' and workspace_id in (select public.user_workspaces())
  );

-- card_checklist_items / card_assignees RLS: rewired off cards.owner_id
-- directly now that the projects join they used to go through is gone.
drop policy if exists "member can CRUD checklist items in own workspace" on card_checklist_items;

create policy "owner can CRUD own card checklist items" on card_checklist_items
  for all using (
    exists (select 1 from cards c where c.id = card_checklist_items.card_id and c.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from cards c where c.id = card_checklist_items.card_id and c.owner_id = auth.uid())
  );

create policy "team members can view shared card checklist items" on card_checklist_items
  for select using (
    exists (
      select 1 from cards c
      where c.id = card_checklist_items.card_id
        and c.visibility = 'shared'
        and c.workspace_id in (select public.user_workspaces())
    )
  );

drop policy if exists "member can CRUD assignees in own workspace" on card_assignees;

create policy "owner can CRUD own card assignees" on card_assignees
  for all using (
    exists (select 1 from cards c where c.id = card_assignees.card_id and c.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from cards c where c.id = card_assignees.card_id and c.owner_id = auth.uid())
  );

create policy "team members can view shared card assignees" on card_assignees
  for select using (
    exists (
      select 1 from cards c
      where c.id = card_assignees.card_id
        and c.visibility = 'shared'
        and c.workspace_id in (select public.user_workspaces())
    )
  );

-- Now safe to drop the old project-chain columns/types/table.
alter table cards drop constraint if exists cards_progress_check;
alter table cards drop column progress;
alter table cards drop column bucket;
alter table cards drop column card_type;
alter table cards drop column project_id;

drop type card_bucket;
drop type card_type;

-- `projects` is no longer referenced by anything -- signup no longer seeds
-- a default "Inbox" project either (see handle_new_user() below).
drop table projects;

-- Signup no longer seeds a default project -- just the personal workspace.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.workspaces (name, type, owner_id)
    values ('My Workspace', 'personal', new.id)
    returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, name)
    values (new_workspace_id, new.id, 'owner', new.email);

  return new;
end;
$$;
