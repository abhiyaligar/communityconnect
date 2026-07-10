"""add_guardian_recommendations_table

Revision ID: c3f1a8b92e44
Revises: 9bf9e8a719c8
Create Date: 2026-07-10 17:10:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f1a8b92e44'
down_revision: Union[str, None] = '9bf9e8a719c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'guardian_recommendations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('guardian_profile_id', sa.UUID(), nullable=False),
        sa.Column('ward_profile_id', sa.UUID(), nullable=False),
        sa.Column('recommended_profile_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['guardian_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ward_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recommended_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'guardian_profile_id', 'ward_profile_id', 'recommended_profile_id',
            name='uq_guardian_ward_candidate'
        )
    )
    op.create_index('ix_guardian_rec_guardian', 'guardian_recommendations', ['guardian_profile_id'], unique=False)
    op.create_index('ix_guardian_rec_ward', 'guardian_recommendations', ['ward_profile_id'], unique=False)
    op.create_index('ix_guardian_rec_candidate', 'guardian_recommendations', ['recommended_profile_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_guardian_rec_candidate', table_name='guardian_recommendations')
    op.drop_index('ix_guardian_rec_ward', table_name='guardian_recommendations')
    op.drop_index('ix_guardian_rec_guardian', table_name='guardian_recommendations')
    op.drop_table('guardian_recommendations')
