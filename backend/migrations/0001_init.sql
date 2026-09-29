CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'AUDITOR');
CREATE TYPE store_status AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE audit_status AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE issue_type AS ENUM (
  'OUT_OF_STOCK',
  'LOW_STOCK',
  'MISPLACED_PRODUCT',
  'PRICE_LABEL_MISMATCH',
  'PLANOGRAM_VIOLATION',
  'UNKNOWN_PRODUCT',
  'DAMAGED_PACKAGING',
  'SHELF_DISORGANIZATION',
  'EMPTY_SHELF_SPACE'
);
CREATE TYPE severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE review_status AS ENUM ('NEEDS_REVIEW', 'CONFIRMED', 'REJECTED', 'RESOLVED');
CREATE TYPE task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'AUDITOR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_region VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(30),
  status store_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  aisle_code VARCHAR(50),
  description TEXT,
  expected_products TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shelf_id UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  image_path TEXT NOT NULL,
  image_original_name VARCHAR(255) NOT NULL,
  image_mime_type VARCHAR(100) NOT NULL,
  image_size_bytes BIGINT NOT NULL,
  audit_notes TEXT,
  status audit_status NOT NULL DEFAULT 'UPLOADED',
  overall_score NUMERIC(5,2),
  ai_summary TEXT,
  ai_model VARCHAR(100),
  ai_raw_response JSONB,
  processing_error TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audits_score_range CHECK (
    overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)
  )
);

CREATE TABLE audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issue_type issue_type NOT NULL,
  severity severity_level NOT NULL,
  review_status review_status NOT NULL DEFAULT 'NEEDS_REVIEW',
  product_name VARCHAR(255),
  brand VARCHAR(255),
  estimated_facings INTEGER,
  confidence NUMERIC(4,3) NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  bounding_box JSONB,
  reviewer_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_findings_confidence_range CHECK (
    confidence >= 0 AND confidence <= 1
  ),
  CONSTRAINT audit_findings_facings_range CHECK (
    estimated_facings IS NULL OR estimated_facings >= 0
  )
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  finding_id UUID REFERENCES audit_findings(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority task_priority NOT NULL DEFAULT 'MEDIUM',
  status task_status NOT NULL DEFAULT 'OPEN',
  due_date DATE,
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES audit_findings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision review_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_stores_organization_id ON stores(organization_id);
CREATE INDEX idx_shelves_store_id ON shelves(store_id);
CREATE INDEX idx_shelves_organization_id ON shelves(organization_id);
CREATE INDEX idx_audits_organization_id ON audits(organization_id);
CREATE INDEX idx_audits_store_id ON audits(store_id);
CREATE INDEX idx_audits_shelf_id ON audits(shelf_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_audit_findings_audit_id ON audit_findings(audit_id);
CREATE INDEX idx_audit_findings_organization_id ON audit_findings(organization_id);
CREATE INDEX idx_audit_findings_issue_type ON audit_findings(issue_type);
CREATE INDEX idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_store_id ON tasks(store_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER stores_set_updated_at
BEFORE UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER shelves_set_updated_at
BEFORE UPDATE ON shelves
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER audits_set_updated_at
BEFORE UPDATE ON audits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER audit_findings_set_updated_at
BEFORE UPDATE ON audit_findings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_isolation_policy
ON organizations
USING (
  id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY users_isolation_policy
ON users
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY stores_isolation_policy
ON stores
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
)
WITH CHECK (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY shelves_isolation_policy
ON shelves
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
)
WITH CHECK (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY audits_isolation_policy
ON audits
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
)
WITH CHECK (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY audit_findings_isolation_policy
ON audit_findings
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
)
WITH CHECK (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY tasks_isolation_policy
ON tasks
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
)
WITH CHECK (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);

CREATE POLICY audit_reviews_isolation_policy
ON audit_reviews
USING (
  organization_id = current_setting('app.current_organization_id', true)::uuid
)
WITH CHECK (
  organization_id = current_setting('app.current_organization_id', true)::uuid
);
