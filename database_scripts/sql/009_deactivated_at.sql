IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user' and COLUMN_NAME = 'deactivated_at')
BEGIN
    ALTER TABLE [dbo].[user] ADD deactivated_at datetime null
END
GO
