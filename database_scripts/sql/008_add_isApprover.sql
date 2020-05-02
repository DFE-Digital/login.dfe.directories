IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'isApprover')
    BEGIN
        ALTER TABLE invitation
        ADD isApprover BIT DEFAULT 0 NOT NULL
    END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'approverEmail')
     BEGIN
       ALTER TABLE invitation
         ADD approverEmail varchar(255) NULL
     END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'orgName')
    BEGIN
        ALTER TABLE invitation
         ADD orgName varchar(500) NULL
    END
GO

