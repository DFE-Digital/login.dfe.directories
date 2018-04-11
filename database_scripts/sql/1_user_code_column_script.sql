
IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user_code' and COLUMN_NAME = 'email')
BEGIN
    ALTER TABLE [dbo].[user_code] ADD email varchar(255) null
END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user_code' and COLUMN_NAME = 'codeType')
BEGIN
    ALTER TABLE [dbo].[user_code] ADD codeType varchar(255) not null default 'PasswordReset'
END
GO


IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'user_code' and COLUMN_NAME = 'contextData')
BEGIN
    ALTER TABLE [dbo].[user_code] ADD contextData varchar(5000) null
END
GO

IF NOT EXISTS(select 1 from sys.indexes where [name] = 'idx_user_code_email' AND object_id = OBJECT_ID('dbo.user_code'))
BEGIN
    CREATE INDEX idx_user_code_email on  user_code (email)
END


/* manual step

select CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
where TABLE_NAME ='user_code'
and CONSTRAINT_TYPE = 'PRIMARY KEY'

alter table user_code drop CONSTRAINT <constraint_name>

alter table user_code add primary key (uid,codeType)

*/