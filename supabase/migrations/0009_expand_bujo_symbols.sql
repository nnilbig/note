-- Expands the symbol system per the blueprint: event (○) and scheduled (<)
-- are new creation-time symbols; cancelled (~) is reachable only through
-- the migrate/cancel interaction cycle (advanceCardState), never typed at
-- creation -- it doesn't make sense to create something pre-cancelled.
alter type bujo_symbol_type add value if not exists 'event';
alter type bujo_symbol_type add value if not exists 'scheduled';
alter type bujo_symbol_type add value if not exists 'cancelled';
