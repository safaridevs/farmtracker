-- Data Export Script - Run this in your OLD Supabase account
-- Copy the output and run as INSERT statements in your new account

-- Export goats data
SELECT 'INSERT INTO goats (id, tag_number, owner_name, gender, goat_photo_url, tag_photo_url, birth_date, weight, health_status, breeding_status, sire_id, dam_id, notes, created_at, created_by) VALUES ' ||
string_agg(
  '(''' || id || ''', ''' || tag_number || ''', ''' || owner_name || ''', ''' || gender || ''', ' ||
  COALESCE('''' || goat_photo_url || '''', 'NULL') || ', ' ||
  COALESCE('''' || tag_photo_url || '''', 'NULL') || ', ' ||
  COALESCE('''' || birth_date || '''', 'NULL') || ', ' ||
  COALESCE(weight::text, 'NULL') || ', ' ||
  COALESCE('''' || health_status || '''', 'NULL') || ', ' ||
  COALESCE('''' || breeding_status || '''', 'NULL') || ', ' ||
  COALESCE('''' || sire_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || dam_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || ''', ' ||
  COALESCE('''' || created_by || '''', 'NULL') || ')',
  ', '
) || ';'
FROM goats;

-- Export health records data
SELECT 'INSERT INTO health_records (id, goat_id, type, title, description, date, next_due_date, veterinarian, cost, notes, created_at, created_by) VALUES ' ||
string_agg(
  '(''' || id || ''', ''' || goat_id || ''', ''' || type || ''', ''' || title || ''', ' ||
  COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || date || ''', ' ||
  COALESCE('''' || next_due_date || '''', 'NULL') || ', ' ||
  COALESCE('''' || veterinarian || '''', 'NULL') || ', ' ||
  COALESCE(cost::text, 'NULL') || ', ' ||
  COALESCE('''' || replace(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || ''', ' ||
  COALESCE('''' || created_by || '''', 'NULL') || ')',
  ', '
) || ';'
FROM health_records;

-- Export breeding records data
SELECT 'INSERT INTO breeding_records (id, doe_id, buck_id, breeding_date, due_date, actual_birth_date, status, number_of_kids, notes, created_at, created_by) VALUES ' ||
string_agg(
  '(''' || id || ''', ''' || doe_id || ''', ' ||
  COALESCE('''' || buck_id || '''', 'NULL') || ', ' ||
  '''' || breeding_date || ''', ' ||
  COALESCE('''' || due_date || '''', 'NULL') || ', ' ||
  COALESCE('''' || actual_birth_date || '''', 'NULL') || ', ' ||
  '''' || status || ''', ' ||
  COALESCE(number_of_kids::text, 'NULL') || ', ' ||
  COALESCE('''' || replace(notes, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || ''', ' ||
  COALESCE('''' || created_by || '''', 'NULL') || ')',
  ', '
) || ';'
FROM breeding_records;