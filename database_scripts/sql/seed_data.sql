
IF NOT EXISTS(SELECT 1 FROM [dbo].[user] where sub = '11d62132-6570-4e63-9dcb-137cc35e7543')
BEGIN
    INSERT INTO [dbo].[user] (sub, email, given_name, family_name, job_title, password, salt, status, createdAt, updatedAt, password_reset_required, is_entra, entra_oid, entra_linked)
    VALUES ('11d62132-6570-4e63-9dcb-137cc35e7543', 'foo@example.com', 'Roger', 'Johnson', 'Administrative Assistant', 'hU1fwuyXCbqDkYVP2uEk72uYM9hfhKL8erDXtBYBm0v+Gb5Th3OOF7+Cvvq62m8glOI23nqYZwA9HKz4w6HWabBfODBBWXDdHNrnszcPnsY+eBxD2NkKA0lEWiugFj+7hbwSMeaVo8s3AZ0q0aFeuC6qSWhJvBdICYZHF/fB7TDIiicEiGP5J620Azc3ma7psx3pNsRWDNbF1fccm1FOkfyUKtwLAICm8e4Z+Fq7lU3jLwAvtui2caMsQrEKt6jiAwKgMxvfD/8m0xV817nE6bi0zUdp/KAGcyQLqJK3PN3/TSVcDUmUAWcJAYABVazQY06QjKEGqjIjQF86dF7kqhzci8ywaDr687b92bvtH/RBLXQIvULw7yOFAygaMHRrS1unUPPokyE+W7HuwNP+DV6YW9g+fagGZvkZowHAncEZuwtkBU3ISTJym7C1BNM4GSBKxDtLHiu7zW1/2ogXEYMjyD7Qw1owehyhJ90RDxwOLQDw9mKinG+Kyahl8dlIf5xM3UV9ug9Ma1QIGmf7WsL0MZGyqNoiFFi9EOJVn/qZO37+Wyv0KVmPq41FzDR/mHOBfjzqjdEi8unEAnwa2fALLvfg3Zkjsndi12xA7eGlSxGZi7xPI/CPh8BPDpqhSf6qpLsWDzJln/820aeSMpxRZ88xyt8IElVzXlD4Xr8=', 'Cndae%%7BQhF>GcdEZMBkrH&b', 0, '2017-01-01 00:00:00', '2017-01-01 00:00:00', 0, 0, NULL, NULL)
END
