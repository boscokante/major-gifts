insert into years(year) values (2025),(2026),(2027)
on conflict (year) do nothing;

insert into programs(name) values
('General'),
('Afro-AI'),
('City of Belonging'),
('LOOP'),
('FEST'),
('YOUTH')
on conflict (name) do nothing;

with pg as (
  select id from programs where name = 'General'
),
pa as (
  select id from programs where name = 'Afro-AI'
),
pc as (
  select id from programs where name = 'City of Belonging'
),
pl as (
  select id from programs where name = 'LOOP'
),
pf as (
  select id from programs where name = 'FEST'
),
py as (
  select id from programs where name = 'YOUTH'
)
insert into budgets(program_id, year, amount)
select id, yr.year, amounts.amount
from programs p
join (values
  ('General', 2025, 650000.00),
  ('General', 2026, 680000.00),
  ('General', 2027, 710000.00),
  ('Afro-AI', 2025, 420000.00),
  ('Afro-AI', 2026, 430000.00),
  ('Afro-AI', 2027, 440000.00),
  ('City of Belonging', 2025, 390000.00),
  ('City of Belonging', 2026, 395000.00),
  ('City of Belonging', 2027, 410000.00),
  ('LOOP', 2025, 520000.00),
  ('LOOP', 2026, 525000.00),
  ('LOOP', 2027, 540000.00),
  ('FEST', 2025, 310000.00),
  ('FEST', 2026, 320000.00),
  ('FEST', 2027, 335000.00),
  ('YOUTH', 2025, 260000.00),
  ('YOUTH', 2026, 265000.00),
  ('YOUTH', 2027, 275000.00)
) as amounts(program_name, year, amount) on amounts.program_name = p.name
join years yr on yr.year = amounts.year
on conflict (program_id, year) do nothing;

with inserted_grant as (
  insert into grants(code, funder, status, type, notes)
  values ('G-001','Basoko Kamba','Committed','Restricted','Support for Afro-AI, LOOP, YOUTH'),
         ('G-002','Full Spectrum Foundation','Pledged','Unrestricted','Multi-program support'),
         ('G-003','Future Cities Fund','Prospect','Restricted','City programming focus')
  on conflict (code) do update set funder = excluded.funder
  returning id, code
)
insert into grant_year_amounts(grant_id, year, amount)
select ig.id, yr.year, amt.amount
from inserted_grant ig
join (values
  ('G-001', 2025, 450000.00),
  ('G-001', 2026, 470000.00),
  ('G-001', 2027, 490000.00),
  ('G-002', 2025, 300000.00),
  ('G-002', 2026, 310000.00),
  ('G-002', 2027, 320000.00),
  ('G-003', 2025, 200000.00),
  ('G-003', 2026, 210000.00),
  ('G-003', 2027, 220000.00)
) as amt(code, year, amount) on amt.code = ig.code
join years yr on yr.year = amt.year
on conflict (grant_id, year) do update set amount = excluded.amount;

-- Restrictions for restricted grants
insert into grant_restrictions(grant_id, program_id)
select g.id, p.id
from grants g
join programs p on p.name in ('Afro-AI','LOOP','YOUTH')
where g.code = 'G-001'
on conflict (grant_id, program_id) do nothing;

insert into grant_restrictions(grant_id, program_id)
select g.id, p.id
from grants g
join programs p on p.name in ('City of Belonging','LOOP')
where g.code = 'G-003'
on conflict (grant_id, program_id) do nothing;

-- Allocation rules example (20/20/60 split for G-001)
insert into allocation_rules(grant_id, year, program_id, percent)
select g.id, yr.year, p.id,
       case
         when p.name = 'Afro-AI' then 0.2
         when p.name = 'LOOP' then 0.2
         when p.name = 'YOUTH' then 0.6
       end
from grants g
join years yr on yr.year in (2025,2026,2027)
join programs p on p.name in ('Afro-AI','LOOP','YOUTH')
where g.code = 'G-001'
on conflict (grant_id, year, program_id) do update set percent = excluded.percent;

-- G-002 unrestricted equally across programs
insert into allocation_rules(grant_id, year, program_id, percent)
select g.id, yr.year, p.id, 1.0 / 6
from grants g
join years yr on yr.year in (2025,2026,2027)
join programs p on true
where g.code = 'G-002'
on conflict (grant_id, year, program_id) do update set percent = excluded.percent;

-- G-003 restricted to City of Belonging + LOOP (70/30)
insert into allocation_rules(grant_id, year, program_id, percent)
select g.id, yr.year, p.id,
       case when p.name = 'City of Belonging' then 0.7 else 0.3 end
from grants g
join years yr on yr.year in (2025,2026,2027)
join programs p on p.name in ('City of Belonging','LOOP')
where g.code = 'G-003'
on conflict (grant_id, year, program_id) do update set percent = excluded.percent;

-- Actuals sample data
insert into actuals(occurred_on, program_id, type, amount, memo, grant_id)
select date_trunc('day', now())::date - interval '30 day', p.id, 'Expense', 120000.00, 'Program staffing', g.id
from programs p
left join grants g on g.code = 'G-001'
where p.name = 'Afro-AI'
on conflict do nothing;

insert into actuals(occurred_on, program_id, type, amount, memo, grant_id)
select date_trunc('day', now())::date - interval '12 day', p.id, 'Revenue', 50000.00, 'Ticket sales', null
from programs p
where p.name = 'FEST'
on conflict do nothing;

-- Scenario seed: baseline live scenario mirroring budgets and allocations
with live_scenario as (
  insert into scenarios(name, description, is_live)
  values ('Live', 'System generated live scenario', true)
  on conflict (is_live) where is_live is true do update set updated_at = now()
  returning id
)
insert into scenario_budgets(scenario_id, program_id, year, amount)
select ls.id, b.program_id, b.year, b.amount
from live_scenario ls
join budgets b on true
on conflict (scenario_id, program_id, year) do update set amount = excluded.amount;

with live_scenario as (
  select id from scenarios where is_live = true limit 1
)
insert into scenario_allocation_rules(scenario_id, grant_id, year, program_id, percent)
select ls.id, ar.grant_id, ar.year, ar.program_id, ar.percent
from live_scenario ls
join allocation_rules ar on true
on conflict (scenario_id, grant_id, year, program_id) do update set percent = excluded.percent;
