"""add_social_links

Revision ID: 043f8ab9cd77
Revises: 032d97cc0f66
Create Date: 2026-07-01 14:47:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '043f8ab9cd77'
down_revision: Union[str, None] = '032d97cc0f66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('social_links', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'social_links')
