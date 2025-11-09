-- Add unique constraint on user_id in admin_users table
ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);