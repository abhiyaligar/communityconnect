"""add preferred_hobbies and about_partner to preferences

Revision ID: ghi890jkl012
Revises: def567ghi890
Create Date: 2026-07-13 02:00:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'ghi890jkl012'
down_revision: Union[str, None] = 'def567ghi890'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('matrimony_preferences', sa.Column('preferred_hobbies', JSONB, nullable=True))
    op.add_column('matrimony_preferences', sa.Column('about_partner', sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column('matrimony_preferences', 'about_partner')
    op.drop_column('matrimony_preferences', 'preferred_hobbies')
