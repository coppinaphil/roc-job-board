-- Add summary field for job previews
ALTER TABLE jobs ADD COLUMN summary text;

-- Update existing jobs to have summaries (optional)
UPDATE jobs 
SET summary = SUBSTRING(description, 1, 120) || '...'
WHERE summary IS NULL AND description IS NOT NULL;