-- RLS policies and partial/full-text indexes for Milpers CMS

-- Enable pgcrypto/gen_random_uuid if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- For each tenant-aware table, enable row level security
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'User','Category','Content','ContentVersion','Media','Tag','ContentTag','SiteConfig','AuditLog'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS "%s" ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END$$;

-- Example RLS policy for users table: allow access when app.current_tenant_id matches tenant_id
-- Note: Application must set the session variable app.current_tenant_id via SET LOCAL or set_config
CREATE POLICY tenant_isolation_users ON "User"
  USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);

-- Similar policies for other tables
CREATE POLICY tenant_isolation_contents ON "Content"
  USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_media ON "Media"
  USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_categories ON "Category"
  USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_tags ON "Tag"
  USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_content_versions ON "ContentVersion"
  USING (EXISTS (SELECT 1 FROM "Content" WHERE "Content"."id" = "ContentVersion"."contentId" AND "Content"."tenantId" = current_setting('app.current_tenant_id')::uuid));

CREATE POLICY tenant_isolation_site_config ON "SiteConfig"
  USING ("tenantId" = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_audit_log ON "AuditLog"
  USING ("tenantId" IS NULL OR "tenantId" = current_setting('app.current_tenant_id')::uuid);

-- Partial index for scheduled publish where status = 'APPROVED'
CREATE INDEX IF NOT EXISTS idx_contents_scheduled ON "Content"("scheduledAt") WHERE "scheduledAt" IS NOT NULL AND "status" = 'APPROVED';

-- Full-text search index on title + excerpt (indonesian)
CREATE INDEX IF NOT EXISTS idx_contents_fts ON "Content" USING GIN (to_tsvector('indonesian', coalesce("title", '') || ' ' || coalesce("excerpt", '')));
