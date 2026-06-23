// Maps a Data Guide page to a CTA cluster + intent priority.
//
// Resolution order: exact clean-slug override -> section default.
// Seeded from dataguide_article_audit.csv. Priority drives CTA strength:
//   high   -> strong end CTA, inline callout eligible, mobile sticky eligible
//   medium -> soft end CTA, no mobile sticky
//   low    -> soft end CTA routed to the product page, no mobile sticky

import { ClusterId } from './clusters'

export type Priority = 'high' | 'medium' | 'low'

export interface PageCta {
  cluster: ClusterId
  priority: Priority
}

// Defaults applied by top-level section (numeric prefix already stripped).
export const sectionDefaults: Record<string, PageCta> = {
  intro: { cluster: 'database_choice', priority: 'low' },
  datamodeling: { cluster: 'database_choice', priority: 'low' },
  types: { cluster: 'database_choice', priority: 'low' },
  postgresql: { cluster: 'managed_ops', priority: 'high' },
  mysql: { cluster: 'database_choice', priority: 'low' },
  sqlite: { cluster: 'database_choice', priority: 'low' },
  mssql: { cluster: 'database_choice', priority: 'medium' },
  mongodb: { cluster: 'database_choice', priority: 'low' },
  'database-tools': { cluster: 'orm_stack', priority: 'high' },
  'managing-databases': { cluster: 'managed_ops', priority: 'medium' },
  serverless: { cluster: 'serverless_pooling', priority: 'high' },
  'just-for-fun': { cluster: 'database_choice', priority: 'low' },
}

// Per-page overrides, keyed by clean slug (no numeric prefix, no path prefix).
export const slugOverrides: Record<string, PageCta> = {
  // PostgreSQL hosting / RDS -> console, hosting copy
  'postgresql/5-ways-to-host-postgresql': { cluster: 'postgres_hosting', priority: 'high' },
  'postgresql/setting-up-postgresql-on-rds': { cluster: 'postgres_hosting', priority: 'high' },

  // Connection pooling lives under database-tools but is a pooling/serverless fit
  'database-tools/connection-pooling': { cluster: 'serverless_pooling', priority: 'high' },

  // Performance / slow-query education -> Query Insights
  'postgresql/reading-and-querying-data/optimizing-postgresql': {
    cluster: 'performance',
    priority: 'high',
  },
  'managing-databases/how-to-spot-bottlenecks-in-performance': {
    cluster: 'performance',
    priority: 'high',
  },

  // Managed-operations pain -> managed Postgres value
  'managing-databases/database-troubleshooting': { cluster: 'managed_ops', priority: 'high' },
  'managing-databases/backup-considerations': { cluster: 'managed_ops', priority: 'high' },
  'managing-databases/testing-in-production': { cluster: 'managed_ops', priority: 'high' },
  'managing-databases/intro-to-full-text-search': { cluster: 'managed_ops', priority: 'high' },
  'managing-databases/syncing-development-databases-between-team-members': {
    cluster: 'managed_ops',
    priority: 'high',
  },

  // ORM / TypeScript -> product, ORM stack copy
  'database-tools/top-nodejs-orms-query-builders-and-database-libraries': {
    cluster: 'orm_stack',
    priority: 'high',
  },
  'database-tools/evaluating-type-safety-in-the-top-8-typescript-orms': {
    cluster: 'orm_stack',
    priority: 'high',
  },
  'types/relational/what-is-an-orm': { cluster: 'orm_stack', priority: 'high' },
  'types/relational/comparing-sql-query-builders-and-orms': {
    cluster: 'orm_stack',
    priority: 'high',
  },
  'types/relational/what-are-database-migrations': { cluster: 'orm_stack', priority: 'high' },
  'types/relational/migration-strategies': { cluster: 'orm_stack', priority: 'high' },
  'types/relational/expand-and-contract-pattern': { cluster: 'orm_stack', priority: 'high' },
  'types/relational/infrastructure-architecture': { cluster: 'orm_stack', priority: 'high' },
  'types/relational-vs-document-databases': { cluster: 'orm_stack', priority: 'medium' },

  // Lower-intent education that would otherwise inherit a high section default
  'managing-databases/microservices-vs-monoliths': { cluster: 'database_choice', priority: 'low' },
  'managing-databases/introduction-to-OLAP-OLTP': { cluster: 'database_choice', priority: 'low' },
  'managing-databases/introduction-database-caching': {
    cluster: 'database_choice',
    priority: 'low',
  },
}
