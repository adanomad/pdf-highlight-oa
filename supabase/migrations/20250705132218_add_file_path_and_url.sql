-- directly storing public url for easy access; will change to signed url if time allows
ALTER TABLE pdf ADD COLUMN file_path TEXT;
ALTER TABLE pdf ADD COLUMN file_url TEXT;