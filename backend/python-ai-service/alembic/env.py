import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool, text

from app.shared.database import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override URL from env if available
db_url = os.getenv("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    config.set_main_option("sqlalchemy.url", db_url)

target_metadata = Base.metadata

SCHEMA = "intel"


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        version_table_schema=SCHEMA,
    )
    with context.begin_transaction():
        context.execute(f"SET search_path TO {SCHEMA}")
        context.run_migrations()


def include_schema(names, type_, parent_names):
    if type_ == "schema":
        return names == SCHEMA
    return True


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema=SCHEMA,
            include_schemas=True,
            include_name=include_schema,
        )
        with context.begin_transaction():
            connection.execute(text(f"SET search_path TO {SCHEMA},public"))
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
