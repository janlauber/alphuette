-- The site has its own domain now; Tom's private address is no longer shown or used.
update settings set value = jsonb_set(value, '{email}', '"hallo@alphuette-kiental.ch"')
where key = 'host' and value->>'email' = 'alt@example.ch';
