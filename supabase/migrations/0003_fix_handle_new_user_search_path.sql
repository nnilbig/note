-- Fixes "Database error saving new user" on signup: the trigger function
-- referenced `workspaces` / `workspace_members` / `projects` without a
-- schema prefix. The role that fires this trigger (supabase_auth_admin)
-- does not have `public` in its default search_path, so those unqualified
-- names failed to resolve inside the SECURITY DEFINER function. Fully
-- qualifying with `public.` and pinning search_path to '' avoids relying
-- on the caller's search_path at all (also closes a search_path-hijacking
-- risk in SECURITY DEFINER functions, per Supabase's own guidance).

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

  insert into public.projects (workspace_id, title, cycle)
    values (new_workspace_id, 'Inbox', 'weekly');

  return new;
end;
$$;
