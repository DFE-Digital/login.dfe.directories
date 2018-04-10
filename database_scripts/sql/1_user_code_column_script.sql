
IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_code' and COLUMN_NAME = 'email')
BEGIN
    ALTER TABLE [dbo].[user_code] ADD email varchar(255) null
END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_code' and COLUMN_NAME = 'context_data')
BEGIN
    ALTER TABLE [dbo].[user_code] ADD context_data varchar(5000) null
END
GO

IF NOT EXISTS(select 1 from sys.indexes where [name] = 'idx_user_code_email' AND object_id = OBJECT_ID('dbo.user_code'))
BEGIN
    CREATE INDEX idx_user_code_email on  user_code (email)
END
