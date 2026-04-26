Generated bcrypt hash for password `godabeg` with cost factor 10:

```text
$2b$10$huu/DYa78tWOjT4JR5xDJORUOCL72av2L9FzgkZbGflbXka.NQU..
```

Plan after you verify/approve:

1. Insert exactly one row into `winam_admin_users`:
   ```sql
   INSERT INTO winam_admin_users (email, password_hash, role)
   VALUES (
     'hello@scriptdeskng.com',
     '$2b$10$huu/DYa78tWOjT4JR5xDJORUOCL72av2L9FzgkZbGflbXka.NQU..',
     'admin'
   );
   ```

2. Make no code changes and no schema changes.

3. Report the insert result back to you.