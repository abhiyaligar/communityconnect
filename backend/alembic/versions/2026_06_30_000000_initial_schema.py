"""initial_schema

Revision ID: 2026_06_30_000000
Revises: 
Create Date: 2026-06-30 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2026_06_30_000000'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('phone_number', sa.String(length=15), unique=True, nullable=False),
        sa.Column('email', sa.String(length=255), unique=True, nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('role', sa.Enum('community_admin', 'local_admin', 'verified_adult', 'minor', 'unverified', name='user_role'), nullable=False, server_default='unverified'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('idx_users_phone', 'users', ['phone_number'])

    # 3. Create admin_regions table
    op.create_table(
        'admin_regions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=100), unique=True, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 4. Create local_admin_regions join table
    op.create_table(
        'local_admin_regions',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('region_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('admin_regions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 5. Create family_units table (without family_head_id FK initially to avoid circular dependency)
    op.create_table(
        'family_units',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('family_head_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 6. Create profiles table
    op.create_table(
        'profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), unique=True, nullable=True),
        sa.Column('family_unit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('family_units.id', ondelete='SET NULL'), nullable=True),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('gender', sa.Enum('male', 'female', 'other', name='gender'), nullable=False),
        sa.Column('marital_status', sa.Enum('single', 'married', 'divorced', 'widowed', name='marital_status'), nullable=False, server_default='single'),
        sa.Column('profile_photo_url', sa.String(length=512), nullable=False),
        sa.Column('contact_number', sa.String(length=15), nullable=True),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('occupation', sa.String(length=100), nullable=True),
        sa.Column('is_memorial', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('idx_profiles_user_id', 'profiles', ['user_id'])
    op.create_index('idx_profiles_family_unit_id', 'profiles', ['family_unit_id'])
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE INDEX idx_profiles_name_trgm ON profiles USING gin (full_name gin_trgm_ops)")
    op.execute("CREATE INDEX idx_profiles_active_members ON profiles(id) WHERE is_memorial = FALSE")

    # 7. Add foreign key for family_head_id to family_units table (resolving circular reference)
    op.create_foreign_key(
        'fk_family_head',
        'family_units', 'profiles',
        ['family_head_id'], ['id'],
        ondelete='SET NULL', use_alter=True
    )

    # 8. Create verification_requests table
    op.create_table(
        'verification_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('target_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('region_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('admin_regions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('family_member_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.Enum('pending', 'local_approved', 'local_rejected', 'approved', 'rejected', 'escalated', name='verification_status'), nullable=False, server_default='pending'),
        sa.Column('escalated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('escalation_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('idx_verification_requests_target', 'verification_requests', ['target_user_id'])

    # 9. Create verification_approvals table
    op.create_table(
        'verification_approvals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('verification_request_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('verification_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('approver_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('approver_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), nullable=True),
        sa.Column('approver_role', sa.String(length=50), nullable=False),
        sa.Column('decision', sa.String(length=20), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('idx_verification_approvals_req_id', 'verification_approvals', ['verification_request_id'])

    # 10. Create matrimony_profiles table
    op.create_table(
        'matrimony_profiles',
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('opted_in', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('double_approval_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('family_co_approver_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('about_me', sa.Text(), nullable=True),
        sa.Column('education', sa.String(length=255), nullable=True),
        sa.Column('family_background', sa.Text(), nullable=True),
        sa.Column('hobbies', sa.Text(), nullable=True),
        sa.Column('preferences', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.execute("CREATE INDEX idx_matrimony_active_profiles ON matrimony_profiles(profile_id) WHERE opted_in = TRUE")
    op.execute("CREATE INDEX idx_matrimony_preferences ON matrimony_profiles USING gin (preferences)")

    # 11. Create connection_requests table
    op.create_table(
        'connection_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('sender_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('receiver_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.Enum('pending_self_approval', 'pending_family_approval', 'approved', 'declined_by_self', 'declined_by_family', 'revoked', name='connection_request_status'), nullable=False, server_default='pending_self_approval'),
        sa.Column('self_approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('family_approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('family_co_approver_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.UniqueConstraint('sender_profile_id', 'receiver_profile_id', name='unique_sender_receiver')
    )
    op.create_index('idx_connection_requests_sender', 'connection_requests', ['sender_profile_id'])
    op.create_index('idx_connection_requests_receiver', 'connection_requests', ['receiver_profile_id'])

    # 12. Create memorial_records table
    op.create_table(
        'memorial_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('date_of_death', sa.Date(), nullable=False),
        sa.Column('announced_by_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('verified_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('announcement_notes', sa.Text(), nullable=True),
        sa.Column('archived_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('idx_memorial_records_profile_id', 'memorial_records', ['profile_id'])

    # 13. Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_values', postgresql.JSONB(), nullable=True),
        sa.Column('new_values', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 14. Create Database Triggers and Trigger Functions
    # 14.1 update_updated_at function & triggers
    op.execute("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    op.execute("CREATE TRIGGER trg_update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    op.execute("CREATE TRIGGER trg_update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    op.execute("CREATE TRIGGER trg_update_family_units_updated_at BEFORE UPDATE ON family_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    op.execute("CREATE TRIGGER trg_update_verification_requests_updated_at BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    op.execute("CREATE TRIGGER trg_update_matrimony_profiles_updated_at BEFORE UPDATE ON matrimony_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    op.execute("CREATE TRIGGER trg_update_connection_requests_updated_at BEFORE UPDATE ON connection_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 14.2 Minor Integrity Check Trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_minor_integrity()
    RETURNS TRIGGER AS $$
    DECLARE
        calculated_age INT;
    BEGIN
        calculated_age := EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
        
        -- Under 18 constraint
        IF calculated_age < 18 THEN
            IF NEW.user_id IS NOT NULL THEN
                RAISE EXCEPTION 'Database Integrity Failure: Minors (under 18) cannot have user accounts.';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    op.execute("CREATE TRIGGER trg_validate_minor_integrity BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION validate_minor_integrity();")

    # 14.3 Matrimony Age Check Trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_matrimony_eligible_age()
    RETURNS TRIGGER AS $$
    DECLARE
        member_dob DATE;
        calculated_age INT;
    BEGIN
        SELECT date_of_birth INTO member_dob FROM profiles WHERE id = NEW.profile_id;
        calculated_age := EXTRACT(YEAR FROM AGE(member_dob));
        
        IF calculated_age < 18 THEN
            RAISE EXCEPTION 'Database Integrity Failure: Minors (under 18) cannot opt into matrimony profiles.';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    op.execute("CREATE TRIGGER trg_validate_matrimony_eligible_age BEFORE INSERT OR UPDATE ON matrimony_profiles FOR EACH ROW EXECUTE FUNCTION validate_matrimony_eligible_age();")

    # 14.4 Memorial Record Conversion Trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION handle_memorial_deactivation()
    RETURNS TRIGGER AS $$
    DECLARE
        linked_user_id UUID;
    BEGIN
        -- Force is_memorial state on profile
        UPDATE profiles SET is_memorial = TRUE WHERE id = NEW.profile_id;
        
        -- Extract associated login user
        SELECT user_id INTO linked_user_id FROM profiles WHERE id = NEW.profile_id;
        
        -- Deactivate auth user
        IF linked_user_id IS NOT NULL THEN
            UPDATE users SET is_active = FALSE WHERE id = linked_user_id;
        END IF;
        
        -- Opt out from matrimony matches
        UPDATE matrimony_profiles SET opted_in = FALSE WHERE profile_id = NEW.profile_id;
        
        -- Terminate active/pending requests
        UPDATE connection_requests 
        SET status = 'revoked' 
        WHERE (sender_profile_id = NEW.profile_id OR receiver_profile_id = NEW.profile_id)
          AND status IN ('pending_self_approval', 'pending_family_approval');
          
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    op.execute("CREATE TRIGGER trg_handle_memorial_deactivation AFTER INSERT ON memorial_records FOR EACH ROW EXECUTE FUNCTION handle_memorial_deactivation();")


def downgrade() -> None:
    # Drop Triggers and Functions
    op.execute("DROP TRIGGER IF EXISTS trg_handle_memorial_deactivation ON memorial_records;")
    op.execute("DROP FUNCTION IF EXISTS handle_memorial_deactivation();")
    op.execute("DROP TRIGGER IF EXISTS trg_validate_matrimony_eligible_age ON matrimony_profiles;")
    op.execute("DROP FUNCTION IF EXISTS validate_matrimony_eligible_age();")
    op.execute("DROP TRIGGER IF EXISTS trg_validate_minor_integrity ON profiles;")
    op.execute("DROP FUNCTION IF EXISTS validate_minor_integrity();")
    op.execute("DROP TRIGGER IF EXISTS trg_update_connection_requests_updated_at ON connection_requests;")
    op.execute("DROP TRIGGER IF EXISTS trg_update_matrimony_profiles_updated_at ON matrimony_profiles;")
    op.execute("DROP TRIGGER IF EXISTS trg_update_verification_requests_updated_at ON verification_requests;")
    op.execute("DROP TRIGGER IF EXISTS trg_update_family_units_updated_at ON family_units;")
    op.execute("DROP TRIGGER IF EXISTS trg_update_profiles_updated_at ON profiles;")
    op.execute("DROP TRIGGER IF EXISTS trg_update_users_updated_at ON users;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")

    # Drop Tables
    op.drop_table('audit_logs')
    op.drop_table('memorial_records')
    op.drop_table('connection_requests')
    op.drop_table('matrimony_profiles')
    op.drop_table('verification_approvals')
    op.drop_table('verification_requests')
    op.drop_table('profiles')
    op.drop_table('family_units')
    op.drop_table('local_admin_regions')
    op.drop_table('admin_regions')
    op.drop_table('users')

    # Drop Enums
    op.execute("DROP TYPE IF EXISTS connection_request_status;")
    op.execute("DROP TYPE IF EXISTS marital_status;")
    op.execute("DROP TYPE IF EXISTS gender;")
    op.execute("DROP TYPE IF EXISTS verification_status;")
    op.execute("DROP TYPE IF EXISTS user_role;")
