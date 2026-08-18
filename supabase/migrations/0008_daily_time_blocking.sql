-- Daily Log time-blocking, per readingoutpost.com/bullet-journal-remote/:
-- cards can now carry a scheduled_start/scheduled_end to sit in a time-block
-- grid, or be flagged is_shallow_task to sit in the low-cognitive batch zone
-- instead. Neither applies outside the Daily tab -- weekly/monthly/future
-- cards ignore both columns.
alter table cards add column scheduled_start time;
alter table cards add column scheduled_end time;
alter table cards add column is_shallow_task boolean not null default false;

-- End-of-day "shutdown ritual" review, one row per user per calendar date --
-- a journal entry about the day, not a task, so it doesn't belong in cards.
create table daily_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  shutdown_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, log_date)
);

create trigger trg_daily_reviews_updated_at before update on daily_reviews
  for each row execute procedure set_updated_at();

alter table daily_reviews enable row level security;

create policy "owner can CRUD own daily reviews" on daily_reviews
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
