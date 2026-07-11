"""add chat composite index and fix chat_message id default

Revision ID: a1b2c3d4e5f6
Revises: c61f29a553af
Create Date: 2026-07-11 09:00:00.000000+00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c61f29a553af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add composite index for chat message queries (M-55)
    op.create_index(
        'ix_chat_sender_receiver_created',
        'chat_messages',
        ['sender_profile_id', 'receiver_profile_id', 'created_at'],
        unique=False
    )

    # Add server_default to chat_messages.id (L-13)
    op.alter_column('chat_messages', 'id',
                    server_default=text('gen_random_uuid()'),
                    existing_type=UUID(as_uuid=True),
                    existing_nullable=False)


def downgrade() -> None:
    # Remove server_default from chat_messages.id
    op.alter_column('chat_messages', 'id',
                    server_default=None,
                    existing_type=UUID(as_uuid=True),
                    existing_nullable=False)

    # Drop composite index
    op.drop_index('ix_chat_sender_receiver_created', table_name='chat_messages')
