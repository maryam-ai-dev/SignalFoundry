ALTER TABLE core.users
    ADD COLUMN account_mode VARCHAR(20) NOT NULL DEFAULT 'FOUNDER';

ALTER TABLE core.users
    ADD CONSTRAINT account_mode_valid
    CHECK (account_mode IN ('FOUNDER', 'INVESTOR'));
