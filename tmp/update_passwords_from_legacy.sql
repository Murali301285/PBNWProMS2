-- Update Passwords in TblUser_New from legacy TblUser
BEGIN TRAN;

UPDATE un
SET un.Password = u.Password
FROM [Master].[TblUser_New] un
INNER JOIN [Master].[TblUser] u ON un.UserName = u.UserName;

-- COMMIT;
-- ROLLBACK;
