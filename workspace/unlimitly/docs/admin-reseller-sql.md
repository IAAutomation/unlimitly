# Admin + Reseller RPCs — SQL to run in Supabase

Paste this in your Supabase **SQL Editor** (project `sqkvakhzgsgqvfayefwm`).
It assumes you already ran the earlier schema (tables `license_keys`,
`resellers`, `user_roles`, plus `unl_activate_key` / `unl_validate_key` /
`has_role`). Column names below match the plan — if yours differ, adjust
column references only.

## Assumed shape (reference)

```sql
-- license_keys
--   key text primary key
--   duration_type text  -- '1m' | '3m' | '6m' | '1y' | 'lifetime'
--   status text         -- 'unused' | 'active' | 'revoked' | 'expired'
--   device_fingerprint text
--   activated_at timestamptz
--   expires_at timestamptz
--   client_name text
--   created_by_admin_id uuid references auth.users(id)
--   created_by_reseller_id uuid references public.resellers(id)
--   created_at timestamptz default now()

-- resellers
--   id uuid primary key default gen_random_uuid()
--   user_id uuid unique references auth.users(id) on delete cascade
--   quota int not null default 10
--   keys_created int not null default 0
--   disabled boolean not null default false
--   created_at timestamptz default now()
```

Grants (safe to re-run):

```sql
grant select on public.license_keys to authenticated;
grant select, update on public.resellers to authenticated;
grant all on public.license_keys to service_role;
grant all on public.resellers   to service_role;
```

## Helper — generate a key `UNL-XXXX-XXXX-XXXX-XXXX`

```sql
create or replace function public.unl_gen_key()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no confusing chars
  seg text; out text := 'UNL';
  i int; j int;
begin
  for i in 1..4 loop
    seg := '';
    for j in 1..4 loop
      seg := seg || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
    end loop;
    out := out || '-' || seg;
  end loop;
  return out;
end $$;
```

## Duration helper

```sql
create or replace function public.unl_duration_to_expiry(p_duration text)
returns timestamptz language sql stable as $$
  select case p_duration
    when '1m' then now() + interval '30 days'
    when '3m' then now() + interval '90 days'
    when '6m' then now() + interval '180 days'
    when '1y' then now() + interval '365 days'
    when 'lifetime' then null
    else now() + interval '30 days'
  end
$$;

-- Compatibility alias for older activation RPCs that still call
-- unl_duration_to_expire(...). Safe to keep permanently.
create or replace function public.unl_duration_to_expire(p_duration text)
returns timestamptz
language sql stable
set search_path = public
as $$
  select public.unl_duration_to_expiry(p_duration)
$$;

-- If your project has a key_duration enum, this overload is required because
-- Postgres resolves unl_duration_to_expire(key_duration) separately from text.
create or replace function public.unl_duration_to_expire(p_duration public.key_duration)
returns timestamptz
language sql stable
set search_path = public
as $$
  select public.unl_duration_to_expiry(p_duration::text)
$$;

grant execute on function public.unl_duration_to_expiry(text) to anon, authenticated;
grant execute on function public.unl_duration_to_expire(text) to anon, authenticated;
grant execute on function public.unl_duration_to_expire(public.key_duration) to anon, authenticated;
```

## ADMIN RPCs

```sql
create or replace function public.unl_admin_create_key(
  p_duration text, p_client_name text default null
) returns table(key text)
language plpgsql security definer set search_path = public as $$
declare v_key text; begin
  if not has_role(auth.uid(), 'admin') then raise exception 'not admin'; end if;
  loop
    v_key := unl_gen_key();
    exit when not exists (select 1 from license_keys where license_keys.key = v_key);
  end loop;
  insert into license_keys(key, duration_type, status, client_name, created_by_admin_id)
  values (v_key, p_duration, 'unused', p_client_name, auth.uid());
  return query select v_key;
end $$;

create or replace function public.unl_admin_list_keys()
returns table(
  key text, duration_type text, status text, device_fingerprint text,
  activated_at timestamptz, expires_at timestamptz, client_name text,
  created_at timestamptz, created_by_admin_id uuid,
  created_by_reseller_id uuid, reseller_email text
) language sql security definer set search_path = public as $$
  select lk.key, lk.duration_type, lk.status, lk.device_fingerprint,
         lk.activated_at, lk.expires_at, lk.client_name, lk.created_at,
         lk.created_by_admin_id, lk.created_by_reseller_id,
         u.email::text as reseller_email
  from license_keys lk
  left join resellers r on r.id = lk.created_by_reseller_id
  left join auth.users u on u.id = r.user_id
  where has_role(auth.uid(), 'admin')
  order by lk.created_at desc
$$;

create or replace function public.unl_admin_revoke_key(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin') then raise exception 'not admin'; end if;
  update license_keys set status = 'revoked' where key = p_key;
end $$;

create or replace function public.unl_admin_reset_binding(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin') then raise exception 'not admin'; end if;
  update license_keys
     set device_fingerprint = null,
         activated_at = null,
         status = case when status = 'active' then 'unused' else status end
   where key = p_key;
end $$;

create or replace function public.unl_admin_grant_reseller(
  p_email text, p_quota int default 10
) returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; begin
  if not has_role(auth.uid(), 'admin') then raise exception 'not admin'; end if;
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then raise exception 'user with that email not found; create them first in Auth → Users'; end if;
  insert into resellers(user_id, quota) values (v_uid, p_quota)
    on conflict (user_id) do update set quota = excluded.quota, disabled = false;
  insert into user_roles(user_id, role) values (v_uid, 'reseller')
    on conflict (user_id, role) do nothing;
end $$;

create or replace function public.unl_admin_list_resellers()
returns table(
  id uuid, user_id uuid, email text, quota int,
  keys_created int, disabled boolean, created_at timestamptz
) language sql security definer set search_path = public as $$
  select r.id, r.user_id, u.email::text, r.quota, r.keys_created, r.disabled, r.created_at
  from resellers r
  join auth.users u on u.id = r.user_id
  where has_role(auth.uid(), 'admin')
  order by r.created_at desc
$$;

create or replace function public.unl_admin_set_reseller_quota(
  p_reseller_id uuid, p_quota int
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin') then raise exception 'not admin'; end if;
  update resellers set quota = p_quota where id = p_reseller_id;
end $$;

create or replace function public.unl_admin_toggle_reseller(
  p_reseller_id uuid, p_disabled boolean
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(auth.uid(), 'admin') then raise exception 'not admin'; end if;
  update resellers set disabled = p_disabled where id = p_reseller_id;
end $$;
```

## RESELLER RPCs

```sql
create or replace function public.unl_reseller_me()
returns table(id uuid, quota int, keys_created int, disabled boolean)
language sql security definer set search_path = public as $$
  -- keys_created is computed dynamically from non-revoked keys so that
  -- revoking or deleting a key immediately frees quota again.
  select r.id,
         r.quota,
         coalesce((
           select count(*)::int from license_keys lk
           where lk.created_by_reseller_id = r.id
             and lk.status <> 'revoked'
         ), 0) as keys_created,
         r.disabled
  from resellers r
  where r.user_id = auth.uid() and has_role(auth.uid(), 'reseller')
$$;

create or replace function public.unl_reseller_create_key(
  p_duration text, p_client_name text default null
) returns table(key text)
language plpgsql security definer set search_path = public as $$
declare
  v_key text;
  v_r resellers%rowtype;
  v_used int;
begin
  if not has_role(auth.uid(), 'reseller') then raise exception 'not a reseller'; end if;
  select * into v_r from resellers where user_id = auth.uid() for update;
  if v_r.disabled then raise exception 'reseller disabled'; end if;
  select count(*)::int into v_used
    from license_keys
   where created_by_reseller_id = v_r.id and status <> 'revoked';
  if v_used >= v_r.quota then raise exception 'quota reached'; end if;
  if p_duration = 'lifetime' then raise exception 'lifetime keys are admin-only'; end if;
  loop
    v_key := unl_gen_key();
    exit when not exists (select 1 from license_keys where license_keys.key = v_key);
  end loop;
  insert into license_keys(key, duration_type, status, client_name, created_by_reseller_id)
  values (v_key, p_duration, 'unused', p_client_name, v_r.id);
  -- keep the legacy counter roughly in sync for admin views
  update resellers set keys_created = v_used + 1 where id = v_r.id;
  return query select v_key;
end $$;

create or replace function public.unl_reseller_list_keys()
returns table(
  key text, duration_type text, status text, device_fingerprint text,
  activated_at timestamptz, expires_at timestamptz, client_name text,
  created_at timestamptz
) language sql security definer set search_path = public as $$
  select lk.key, lk.duration_type, lk.status, lk.device_fingerprint,
         lk.activated_at, lk.expires_at, lk.client_name, lk.created_at
  from license_keys lk
  join resellers r on r.id = lk.created_by_reseller_id
  where r.user_id = auth.uid() and has_role(auth.uid(), 'reseller')
  order by lk.created_at desc
$$;

create or replace function public.unl_reseller_reset_binding(p_key text)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner uuid; begin
  if not has_role(auth.uid(), 'reseller') then raise exception 'not a reseller'; end if;
  select r.user_id into v_owner
    from license_keys lk
    join resellers r on r.id = lk.created_by_reseller_id
   where lk.key = p_key;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'not your key'; end if;
  update license_keys
     set device_fingerprint = null,
         activated_at = null,
         status = case when status = 'active' then 'unused' else status end
   where key = p_key;
end $$;

-- Revoke one of the reseller's own keys. Frees quota because
-- unl_reseller_me / unl_reseller_create_key count non-revoked keys only.
create or replace function public.unl_reseller_revoke_key(p_key text)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_rid uuid; begin
  if not has_role(auth.uid(), 'reseller') then raise exception 'not a reseller'; end if;
  select r.user_id, r.id into v_owner, v_rid
    from license_keys lk
    join resellers r on r.id = lk.created_by_reseller_id
   where lk.key = p_key;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'not your key'; end if;
  update license_keys set status = 'revoked' where key = p_key;
  update resellers
     set keys_created = coalesce((
       select count(*)::int from license_keys lk
       where lk.created_by_reseller_id = v_rid and lk.status <> 'revoked'
     ), 0)
   where id = v_rid;
end $$;
```

## Grants for the RPCs

```sql
grant execute on function
  public.unl_admin_create_key(text,text),
  public.unl_admin_list_keys(),
  public.unl_admin_revoke_key(text),
  public.unl_admin_reset_binding(text),
  public.unl_admin_grant_reseller(text,int),
  public.unl_admin_list_resellers(),
  public.unl_admin_set_reseller_quota(uuid,int),
  public.unl_admin_toggle_reseller(uuid,boolean),
  public.unl_reseller_me(),
  public.unl_reseller_create_key(text,text),
  public.unl_reseller_list_keys(),
  public.unl_reseller_reset_binding(text),
  public.unl_reseller_revoke_key(text)
to authenticated;
```

## Creating a reseller — quick recipe

1. In Supabase → **Authentication → Users → Add user** (email + password).
2. Open `/admin-og`, go to **Resellers**, paste that email + quota, click **Grant**.
3. Give the reseller the email + password + `/resellers-og` URL.