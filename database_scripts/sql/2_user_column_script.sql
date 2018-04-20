
IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user' and COLUMN_NAME = 'legacy_username')
BEGIN
    ALTER TABLE [dbo].[user] ADD legacy_username varchar(255) null
END
GO
