IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user' and COLUMN_NAME = 'phone_number')
BEGIN
    ALTER TABLE [dbo].[user] ADD phone_number varchar(50) null
END
GO