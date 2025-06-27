-- Add suburb field for Rochester area towns
ALTER TABLE jobs ADD COLUMN suburb text;

-- Create index for suburb filtering
CREATE INDEX jobs_suburb_idx ON jobs (suburb) WHERE suburb IS NOT NULL;