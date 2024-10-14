IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'invitation')
BEGIN
    CREATE TABLE [dbo].[invitation]
    (
      id uniqueidentifier NOT NULL,
      email varchar(255) NOT NULL,
      code varchar(15) NOT NULL,
      firstName varchar(255) NOT NULL,
      lastName varchar(255) NOT NULL,
      originClientId varchar(50) NULL,
      originRedirectUri varchar(1024) NULL,
      selfStarted bit NOT NULL CONSTRAINT [DF_Invitation_SelfStarted] DEFAULT 0,
      overrideSubject varchar(255) NULL,
      overrideBody nvarchar(max) NULL,
      previousUsername varchar(50) NULL,
      previousPassword varchar(255) NULL,
      previousSalt varchar(255) NULL,
      deactivated bit NOT NULL CONSTRAINT [DF_Invitation_Deactivated] DEFAULT 0,
      reason varchar(max) NULL,
      completed bit NOT NULL CONSTRAINT [DF_Invitation_Completed] DEFAULT 0,
      uid uniqueidentifier NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_Invitation] PRIMARY KEY (id)
    )
END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'invitation_callback')
BEGIN
    CREATE TABLE [dbo].[invitation_callback]
    (
      invitationId uniqueidentifier NOT NULL,
      sourceId VARCHAR(255) NOT NULL,
      callbackUrl VARCHAR(1024) NOT NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,

      CONSTRAINT [PK_InvitationCallback] PRIMARY KEY (invitationId, sourceId),
      CONSTRAINT [FK_InvitationCallback_Invitation] FOREIGN KEY (invitationId) REFERENCES [dbo].[invitation](id)
    )
END
GO
