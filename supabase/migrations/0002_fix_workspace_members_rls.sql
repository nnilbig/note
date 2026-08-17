-- Fixes "infinite recursion detected in policy for relation workspace_members":
-- the original SELECT policy queried workspace_members from within its own
-- policy, which re-triggers RLS evaluation on itself. Since Sprint 1 is
-- solo-only, a user only ever needs to see their own membership row.
--
-- TODO(Sprint 4): once team invites ship, widen this so a member can see
-- their teammates' rows too -- via a SECURITY DEFINER helper function
-- (not a direct self-join) to avoid reintroducing recursion.

drop policy if exists "member can read own membership rows" on workspace_members;

create policy "user can read own membership row" on workspace_members
  for select using (user_id = auth.uid());
