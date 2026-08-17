-- Fixes "Cannot read properties of null (reading 'id')" in the app: the
-- workspaces SELECT policy's subquery referenced an unqualified `id`,
-- which Postgres resolved to workspace_members.id (that table's own PK,
-- since it's the innermost scope) instead of the intended workspaces.id.
-- That made the policy compare workspace_members.id to its own
-- workspace_id -- effectively always false -- so no one could ever read
-- a workspace row, and the embedded join in fetchBoard() silently
-- returned null.

drop policy if exists "member can read own workspace" on workspaces;

create policy "member can read own workspace" on workspaces
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
    )
  );
