-- Integration Schemas Redesign (CELEBRATION-BUILDER-REDESIGN-SPEC Part 1)
-- Replaces the previous integration_schemas structure with schema_type/object_type/data model
-- for properties, pipelines, and owners cached from HubSpot (and future integrations).

-- Drop old table (different schema; data will be re-fetched on next OAuth/sync)
DROP TABLE IF EXISTS integration_schemas;

CREATE TABLE integration_schemas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id  uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  schema_type     text NOT NULL,        -- 'properties', 'pipelines', 'owners', 'stages'
  object_type     text,                 -- 'deals', 'contacts', 'companies', 'tickets' (null for pipelines/owners)
  data            jsonb NOT NULL,       -- full schema payload from API
  fetched_at      timestamptz DEFAULT now(),
  expires_at      timestamptz,          -- fetched_at + 24 hours
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Unique constraint: one row per (integration, schema_type, object_type)
-- object_type is '' for pipelines/owners (no CRM object type)
ALTER TABLE integration_schemas
  ADD CONSTRAINT integration_schemas_unique UNIQUE (integration_id, schema_type, object_type);

CREATE INDEX idx_integration_schemas_org_integration
  ON integration_schemas (org_id, integration_id);

-- RLS: users can read schemas for their org's integrations
ALTER TABLE integration_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON integration_schemas
  FOR ALL TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "service_role_all" ON integration_schemas
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
