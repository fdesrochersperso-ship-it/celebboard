-- HubSpot Integration: integration_schemas table, celebration_triggers columns, portal_id index
-- Idempotent where possible (IF NOT EXISTS, DROP IF EXISTS)

-- =============================================================================
-- 1. integration_schemas table
-- =============================================================================

CREATE TABLE IF NOT EXISTS integration_schemas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid REFERENCES integrations(id) ON DELETE CASCADE,
  object_type     text NOT NULL,
  object_label    text NOT NULL,
  properties      jsonb NOT NULL DEFAULT '[]',
  pipeline_stages jsonb DEFAULT '[]',
  cached_at       timestamptz DEFAULT now(),
  UNIQUE(integration_id, object_type)
);

-- RLS
ALTER TABLE integration_schemas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation" ON integration_schemas;
CREATE POLICY "org_isolation" ON integration_schemas
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

DROP POLICY IF EXISTS "service_role_all" ON integration_schemas;
CREATE POLICY "service_role_all" ON integration_schemas
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 2. celebration_triggers — add HubSpot trigger columns
-- =============================================================================

ALTER TABLE celebration_triggers ADD COLUMN IF NOT EXISTS object_type text;
ALTER TABLE celebration_triggers ADD COLUMN IF NOT EXISTS event_category text;
ALTER TABLE celebration_triggers ADD COLUMN IF NOT EXISTS watched_property text;
ALTER TABLE celebration_triggers ADD COLUMN IF NOT EXISTS condition_logic text DEFAULT 'AND';

-- =============================================================================
-- 3. Index for fast portal_id lookups on integrations
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_integrations_hubspot_portal
  ON integrations ((config->>'portal_id'))
  WHERE type = 'hubspot' AND status = 'active';
