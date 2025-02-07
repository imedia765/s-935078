
-- Create storage quotas table
CREATE TABLE storage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_name TEXT NOT NULL,
    max_size_bytes BIGINT NOT NULL,
    warning_threshold_percent INTEGER NOT NULL DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file retention policies table
CREATE TABLE file_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_type TEXT NOT NULL,
    retention_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file retention logs table
CREATE TABLE file_retention_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT NOT NULL
);

-- Function to check and enforce storage quotas
CREATE OR REPLACE FUNCTION check_storage_quota(
    p_bucket_name TEXT,
    p_file_size BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_size BIGINT;
    v_max_size BIGINT;
    v_warning_threshold INTEGER;
BEGIN
    -- Get quota settings
    SELECT max_size_bytes, warning_threshold_percent 
    INTO v_max_size, v_warning_threshold
    FROM storage_quotas 
    WHERE bucket_name = p_bucket_name;

    -- If no quota set, allow upload
    IF v_max_size IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Get current storage size
    SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0)
    INTO v_current_size
    FROM storage.objects
    WHERE bucket_id = p_bucket_name;

    -- Check if new file would exceed quota
    IF (v_current_size + p_file_size) > v_max_size THEN
        RETURN FALSE;
    END IF;

    -- Log warning if approaching threshold
    IF (v_current_size + p_file_size) > (v_max_size * v_warning_threshold / 100) THEN
        INSERT INTO audit_logs (
            operation,
            table_name,
            severity,
            new_values
        ) VALUES (
            'storage_warning',
            'storage_quotas',
            'warning',
            jsonb_build_object(
                'bucket_name', p_bucket_name,
                'current_usage', v_current_size + p_file_size,
                'max_size', v_max_size,
                'usage_percent', ((v_current_size + p_file_size)::float / v_max_size * 100)::int
            )
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files() RETURNS void AS $$
DECLARE
    v_file RECORD;
    v_retention_days INTEGER;
BEGIN
    -- Get files that need to be cleaned up based on retention policy
    FOR v_file IN 
        SELECT 
            o.name as file_path,
            o.metadata->>'type' as file_type,
            o.metadata->>'size' as file_size,
            o.created_at,
            p.retention_days
        FROM storage.objects o
        JOIN file_retention_policies p ON p.file_type = o.metadata->>'type'
        WHERE o.created_at < (NOW() - (p.retention_days || ' days')::INTERVAL)
    LOOP
        -- Delete file from storage
        DELETE FROM storage.objects WHERE name = v_file.file_path;

        -- Log deletion
        INSERT INTO file_retention_logs (
            file_path,
            file_type,
            file_size,
            reason
        ) VALUES (
            v_file.file_path,
            v_file.file_type,
            v_file.file_size::BIGINT,
            'Retention period expired'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup
SELECT cron.schedule(
    'cleanup-expired-files',
    '0 0 * * *', -- Run daily at midnight
    $$SELECT cleanup_expired_files()$$
);

-- Insert default retention policies
INSERT INTO file_retention_policies (file_type, retention_days) VALUES
    ('application/pdf', 365),
    ('image/jpeg', 180),
    ('image/png', 180),
    ('application/msword', 365),
    ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 365);

-- Insert default storage quotas
INSERT INTO storage_quotas (bucket_name, max_size_bytes, warning_threshold_percent) VALUES
    ('profile_documents', 5368709120, 80), -- 5GB
    ('profile_photos', 1073741824, 80);    -- 1GB
