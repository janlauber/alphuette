-- The invoice date: when Tom confirmed. Before, updated_at served, which moves with every change.
alter table bookings add column confirmed_at timestamptz;
update bookings set confirmed_at = updated_at where status = 'bestaetigt';
