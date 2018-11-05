IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user' and COLUMN_NAME = 'last_login')
BEGIN
    ALTER TABLE [dbo].[user] ADD last_login datetime null
END
GO