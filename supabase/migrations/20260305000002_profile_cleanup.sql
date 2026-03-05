-- Remove poe_account_name from profiles
-- discord_username is now set at signup (required in form)

ALTER TABLE public.profiles DROP COLUMN IF EXISTS poe_account_name;

-- Update handle_new_user to also save discord_username from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  discord_value TEXT;
BEGIN
  username_value := NEW.raw_user_meta_data->>'username';
  discord_value  := NEW.raw_user_meta_data->>'discord_username';

  INSERT INTO public.profiles (id, username, discord_username, avatar_url)
  VALUES (
    NEW.id,
    username_value,
    discord_value,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Creates a profile using username and discord_username provided during signup';
