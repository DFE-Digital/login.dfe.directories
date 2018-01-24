IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user')
BEGIN
    CREATE TABLE [dbo].[user]
    (
        sub uniqueidentifier PRIMARY KEY NOT NULL,
        email VARCHAR(255) NOT NULL,
        given_name VARCHAR(255) NOT NULL,
        family_name VARCHAR(255) NOT NULL,
        password VARCHAR(5000) NOT NULL,
        salt VARCHAR(500) NOT NULL,
        status SMALLINT NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL
    )
END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_code')
BEGIN
    CREATE TABLE [dbo].[user_code]
    (
        uid uniqueidentifier PRIMARY KEY NOT NULL,
        code VARCHAR(50) NOT NULL,
        redirectUri VARCHAR(255) NOT NULL,
        clientId VARCHAR(50) NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL
    )
END
GO
