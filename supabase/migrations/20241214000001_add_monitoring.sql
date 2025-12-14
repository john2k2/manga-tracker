
-- Create scrape_logs table
create table scrape_logs (
  id uuid default gen_random_uuid() primary key,
  domain varchar not null,
  url text not null,
  status varchar not null check (status in ('success', 'error', 'partial')),
  duration_ms integer,
  error_message text,
  chapters_found integer default 0,
  created_at timestamp with time zone default now()
);

-- Create issue_reports table
create table issue_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  manga_id uuid references mangas(id),
  description text not null,
  status varchar default 'open' check (status in ('open', 'investigating', 'resolved')),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table scrape_logs enable row level security;
alter table issue_reports enable row level security;

-- Policies for scrape_logs (Admin/Service Role mostly, but let's allow read for authenticated users for the status page)
create policy "Allow read access for authenticated users" on scrape_logs
  for select using (auth.role() = 'authenticated');
  
create policy "Allow insert for service role" on scrape_logs
  for insert with check (true); -- Service role bypasses RLS anyway, but good to be explicit if using anon key? No, we use service key in API.

-- Policies for issue_reports
create policy "Users can create reports" on issue_reports
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own reports" on issue_reports
  for select using (auth.uid() = user_id);

-- Create a view for site health stats
create or replace view site_health_stats as
select 
  domain,
  count(*) as total_attempts,
  count(*) filter (where status = 'success') as success_count,
  count(*) filter (where status = 'error') as error_count,
  avg(duration_ms)::integer as avg_duration_ms,
  max(created_at) as last_attempt_at,
  (count(*) filter (where status = 'success')::float / count(*)::float * 100)::integer as success_rate
from scrape_logs
where created_at > now() - interval '7 days'
group by domain;

-- Grant access to the view
grant select on site_health_stats to authenticated;
