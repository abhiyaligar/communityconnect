"""add matrimony preferences table

Revision ID: def567ghi890
Revises: abc124def567
Create Date: 2026-07-13 01:00:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision: str = 'def567ghi890'
down_revision: Union[str, None] = 'abc124def567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'matrimony_preferences',
        sa.Column('profile_id', UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('strict_rashi', JSONB, nullable=True),
        sa.Column('preferred_rashi', JSONB, nullable=True),
        sa.Column('strict_nakshatra', JSONB, nullable=True),
        sa.Column('preferred_nakshatra', JSONB, nullable=True),
        sa.Column('strict_gotra', JSONB, nullable=True),
        sa.Column('preferred_gotra', JSONB, nullable=True),
        sa.Column('strict_sub_caste', JSONB, nullable=True),
        sa.Column('preferred_sub_caste', JSONB, nullable=True),
        sa.Column('strict_income_min', sa.String(50), nullable=True),
        sa.Column('strict_income_max', sa.String(50), nullable=True),
        sa.Column('preferred_income', sa.String(50), nullable=True),
        sa.Column('strict_age_min', sa.Integer, nullable=True),
        sa.Column('strict_age_max', sa.Integer, nullable=True),
        sa.Column('preferred_age_min', sa.Integer, nullable=True),
        sa.Column('preferred_age_max', sa.Integer, nullable=True),
        sa.Column('strict_height_min', sa.Integer, nullable=True),
        sa.Column('strict_height_max', sa.Integer, nullable=True),
        sa.Column('preferred_height_min', sa.Integer, nullable=True),
        sa.Column('preferred_height_max', sa.Integer, nullable=True),
        sa.Column('strict_weight_min', sa.Integer, nullable=True),
        sa.Column('strict_weight_max', sa.Integer, nullable=True),
        sa.Column('preferred_weight_min', sa.Integer, nullable=True),
        sa.Column('preferred_weight_max', sa.Integer, nullable=True),
        sa.Column('strict_diet', JSONB, nullable=True),
        sa.Column('preferred_diet', JSONB, nullable=True),
        sa.Column('manglik', sa.String(50), nullable=True, default='any'),
        sa.Column('strict_education', JSONB, nullable=True),
        sa.Column('preferred_education', JSONB, nullable=True),
        sa.Column('strict_employment', JSONB, nullable=True),
        sa.Column('preferred_employment', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('matrimony_preferences')
