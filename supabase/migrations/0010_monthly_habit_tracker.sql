-- Monthly Log habit-tracker matrix. A habit is just a named row the user
-- checks off per calendar day -- kept separate from cards since a habit
-- isn't a task with a title/symbol/checklist, it's a recurring yes/no per
-- day. habit_entries has no owner_id of its own; ownership flows through
-- habits.owner_id, same pattern as card_checklist_items -> cards.
create table habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  unique (habit_id, log_date)
);

alter table habits enable row level security;
alter table habit_entries enable row level security;

create policy "owner can CRUD own habits" on habits
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner can CRUD own habit entries" on habit_entries
  for all using (
    exists (select 1 from habits h where h.id = habit_entries.habit_id and h.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from habits h where h.id = habit_entries.habit_id and h.owner_id = auth.uid())
  );
