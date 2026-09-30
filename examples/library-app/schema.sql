CREATE ROLE library_owner NOLOGIN;
CREATE ROLE library_app LOGIN PASSWORD 'disposable-library-password';
CREATE SCHEMA library AUTHORIZATION library_owner;
SET ROLE library_owner;
CREATE TABLE library.schema_version (version integer PRIMARY KEY);
INSERT INTO library.schema_version VALUES (1);
CREATE TABLE library.books (
  tenant_id text NOT NULL,
  id integer NOT NULL,
  title text NOT NULL,
  copies integer NOT NULL CHECK (copies >= 0),
  version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE library.requests (
  tenant_id text NOT NULL,
  key text NOT NULL,
  book_id integer NOT NULL,
  result jsonb NOT NULL,
  PRIMARY KEY (tenant_id, key)
);
CREATE TABLE library.outbox (
  tenant_id text NOT NULL,
  id bigint GENERATED ALWAYS AS IDENTITY,
  payload jsonb NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  acknowledged boolean NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE library.deliveries (
  tenant_id text NOT NULL,
  event_id bigint NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY (tenant_id, event_id)
);
CREATE TABLE library.documents (
  tenant_id text NOT NULL,
  id integer NOT NULL,
  body text NOT NULL,
  embedding real[] NOT NULL,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE library.seed_version (version integer PRIMARY KEY);
INSERT INTO library.seed_version VALUES (1);
RESET ROLE;
INSERT INTO library.books VALUES ('alpha', 1, 'Ulysses', 10, 1), ('beta', 1, 'Private beta book', 20, 1);
INSERT INTO library.documents VALUES
  ('alpha', 1, 'PostgreSQL restore backup recovery', ARRAY[1.0, 0.0]),
  ('alpha', 2, 'Dates and calendar arithmetic', ARRAY[0.0, 1.0]),
  ('alpha', 3, 'Connection pool capacity and request queues', ARRAY[0.6, 0.8]),
  ('beta', 1, 'Private backup instructions', ARRAY[1.0, 0.0]);
SET ROLE library_owner;
ALTER TABLE library.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.books FORCE ROW LEVEL SECURITY;
ALTER TABLE library.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.requests FORCE ROW LEVEL SECURITY;
ALTER TABLE library.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE library.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.deliveries FORCE ROW LEVEL SECURITY;
ALTER TABLE library.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.documents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_books ON library.books USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_requests ON library.requests USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_outbox ON library.outbox USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_deliveries ON library.deliveries USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
CREATE POLICY tenant_documents ON library.documents USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
RESET ROLE;
GRANT USAGE ON SCHEMA library TO library_app;
GRANT SELECT ON library.schema_version, library.seed_version TO library_app;
GRANT SELECT, INSERT, UPDATE ON library.books, library.requests, library.outbox, library.deliveries TO library_app;
GRANT SELECT ON library.documents TO library_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA library TO library_app;
