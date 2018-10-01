IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_device')
BEGIN
    CREATE TABLE [dbo].[user_device]
    (
        id uniqueidentifier NOT NULL,
        uid uniqueidentifier NOT NULL,
        deviceType VARCHAR(255) NOT NULL,
        serialNumber VARCHAR(25) NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL,
        CONSTRAINT [PK_UserDevice] PRIMARY KEY (id),
        CONSTRAINT [UQ_UserDevice_Device] UNIQUE (deviceType, serialNumber),
        CONSTRAINT [FK_UserDevice_User] FOREIGN KEY (uid) REFERENCES [dbo].[user](sub)
    )
END
GO