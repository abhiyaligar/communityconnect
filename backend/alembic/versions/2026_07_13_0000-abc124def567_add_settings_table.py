"""add settings table

Revision ID: abc124def567
Revises: dda73a30d479
Create Date: 2026-07-13 00:00:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'abc124def567'
down_revision: Union[str, None] = 'dda73a30d479'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('settings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.String(length=500), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_settings_key'), 'settings', ['key'], unique=True)

    # Seed default setting
    op.execute(
        "INSERT INTO settings (id, key, value) "
        "VALUES (gen_random_uuid(), 'auto_create_free_membership', 'true')"
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_settings_key'), table_name='settings')
    op.drop_table('settings')
