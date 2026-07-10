"""add_preferred_language_to_user

Revision ID: a492f4c39618
Revises: 94624cc39623
Create Date: 2026-07-10 12:50:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a492f4c39618'
down_revision: Union[str, None] = '94624cc39623'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add preferred_language column to users table
    op.add_column('users', sa.Column('preferred_language', sa.String(length=10), nullable=False, server_default='en'))


def downgrade() -> None:
    # Drop preferred_language column from users table
    op.drop_column('users', 'preferred_language')
