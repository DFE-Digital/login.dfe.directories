IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_callback' AND COLUMN_NAME = 'clientId')
  BEGIN
    ALTER TABLE invitation_callback
      ADD clientId varchar(50) NULL
  END