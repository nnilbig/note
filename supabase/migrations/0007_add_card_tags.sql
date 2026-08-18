-- Category tags on cards (e.g. #跑步, #閱讀), parsed client-side from the
-- rapid-log text -- see parseRapidLogEntry(). Plain text[] rather than a
-- normalized tags table: there's no cross-card tag management UI yet
-- (rename/merge/delete-everywhere), just per-card display and filtering.
alter table cards add column tags text[] not null default '{}';

create index cards_tags_idx on cards using gin (tags);
