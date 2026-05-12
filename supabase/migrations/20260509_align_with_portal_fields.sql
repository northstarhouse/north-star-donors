-- Add account_type to donors
alter table donors add column if not exists account_type text;

-- Add portal-aligned fields to donations
alter table donations add column if not exists payment_type text;
alter table donations add column if not exists benefits text;
alter table donations add column if not exists acknowledged boolean default false;
alter table donations add column if not exists salesforce boolean default false;
alter table donations add column if not exists notes text;

-- Migrate existing type values to portal's categories
update donations set type = 'Donation' where type in ('one-time', 'recurring', 'grant', 'in-kind');

-- Update default for new records
alter table donations alter column type set default 'Donation';
