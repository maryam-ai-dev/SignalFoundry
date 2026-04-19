ALTER TABLE core.users
    ADD COLUMN digest_day VARCHAR(3) NOT NULL DEFAULT 'MON';

ALTER TABLE core.users
    ADD CONSTRAINT digest_day_valid
    CHECK (digest_day IN ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'));
