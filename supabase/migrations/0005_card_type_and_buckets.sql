-- Four-layer time axis: was only week/month, add daily/future to match
-- classic Bullet Journal Daily/Monthly/Future Log structure.
alter type card_bucket add value if not exists 'daily';
alter type card_bucket add value if not exists 'future';

-- Card content category (task/project/habit/note) is a separate dimension
-- from bujo_symbol's status (task/completed/migrated/priority) -- the two
-- combine freely, e.g. a 'project' card can be 'completed' or 'priority'.
create type card_type as enum ('task', 'project', 'habit', 'note');
alter table cards add column card_type card_type not null default 'task';
