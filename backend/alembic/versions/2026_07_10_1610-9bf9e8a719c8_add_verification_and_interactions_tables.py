"""add_verification_and_interactions_tables

Revision ID: 9bf9e8a719c8
Revises: a492f4c39618
Create Date: 2026-07-10 16:10:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9bf9e8a719c8'
down_revision: Union[str, None] = 'a492f4c39618'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add verified_at column to users
    op.add_column('users', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Create profile_likes table
    op.create_table(
        'profile_likes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_profile_id', sa.UUID(), nullable=False),
        sa.Column('liked_profile_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['liked_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_profile_id', 'liked_profile_id', name='uq_user_liked_profile')
    )
    op.create_index(op.f('ix_profile_likes_liked_profile_id'), 'profile_likes', ['liked_profile_id'], unique=False)
    op.create_index(op.f('ix_profile_likes_user_profile_id'), 'profile_likes', ['user_profile_id'], unique=False)

    # 3. Create profile_dislikes table
    op.create_table(
        'profile_dislikes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_profile_id', sa.UUID(), nullable=False),
        sa.Column('disliked_profile_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['disliked_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_profile_id', 'disliked_profile_id', name='uq_user_disliked_profile')
    )
    op.create_index(op.f('ix_profile_dislikes_disliked_profile_id'), 'profile_dislikes', ['disliked_profile_id'], unique=False)
    op.create_index(op.f('ix_profile_dislikes_user_profile_id'), 'profile_dislikes', ['user_profile_id'], unique=False)


def downgrade() -> None:
    # 1. Drop index & table profile_dislikes
    op.drop_index(op.f('ix_profile_dislikes_user_profile_id'), table_name='profile_dislikes')
    op.drop_index(op.f('ix_profile_dislikes_disliked_profile_id'), table_name='profile_dislikes')
    op.drop_table('profile_dislikes')

    # 2. Drop index & table profile_likes
    op.drop_index(op.f('ix_profile_likes_user_profile_id'), table_name='profile_likes')
    op.drop_index(op.f('ix_profile_likes_liked_profile_id'), table_name='profile_likes')
    op.drop_table('profile_likes')

    # 3. Drop verified_at column from users
    op.drop_column('users', 'verified_at')
