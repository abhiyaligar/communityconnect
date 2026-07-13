"""add ip_address column to users

Revision ID: mno345pqr678
Revises: jkl012mno345
Create Date: 2026-07-13 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'mno345pqr678'
down_revision: Union[str, None] = 'jkl012mno345'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('ip_address', sa.String(45), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'ip_address')
