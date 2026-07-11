"""recreate dropped indexes and fix email_verification id default

Revision ID: c61f29a553af
Revises: 1d4b776139cd
Create Date: 2026-07-11 08:00:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = 'c61f29a553af'
down_revision: Union[str, None] = '1d4b776139cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


INDEXES = [
    ('ix_profiles_username', 'profiles', ['username']),
    ('ix_profiles_full_name', 'profiles', ['full_name']),
    ('ix_profiles_family_unit_id', 'profiles', ['family_unit_id']),
    ('ix_memorial_date_of_death', 'memorial_records', ['date_of_death']),
    ('ix_matrimony_opted_in', 'matrimony_profiles', ['opted_in']),
    ('ix_connection_requests_status', 'connection_requests', ['status']),
    ('ix_connection_requests_sender', 'connection_requests', ['sender_profile_id']),
    ('ix_connection_requests_receiver', 'connection_requests', ['receiver_profile_id']),
]


def upgrade() -> None:
    for name, table, cols in INDEXES:
        col_list = ', '.join(cols)
        op.execute(f'CREATE INDEX IF NOT EXISTS {name} ON {table} ({col_list})')

    op.alter_column('email_verifications', 'id',
                    server_default=text('gen_random_uuid()'),
                    existing_type=UUID(as_uuid=True),
                    existing_nullable=False)


def downgrade() -> None:
    op.alter_column('email_verifications', 'id',
                    server_default=None,
                    existing_type=UUID(as_uuid=True),
                    existing_nullable=False)

    for name, table, _ in INDEXES:
        op.execute(f'DROP INDEX IF EXISTS {name}')
