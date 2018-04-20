
IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_legacy_username')
BEGIN
    CREATE TABLE [dbo].[user_legacy_username]
    (
        uid uniqueidentifier PRIMARY KEY NOT NULL,
        legacy_username PRIMARY KEY VARCHAR(255) NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL
    )
END
GO
