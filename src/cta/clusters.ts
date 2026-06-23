// Prisma Postgres conversion clusters.
//
// Single source of truth for CTA copy, destination, and UTM campaign across
// every Data Guide placement (sidebar, inline, end-of-article, mobile sticky).
// Tune copy/destinations here; components stay presentational.

export type Destination = 'product' | 'console'

export type ClusterId =
  | 'postgres_hosting'
  | 'serverless_pooling'
  | 'performance'
  | 'managed_ops'
  | 'orm_stack'
  | 'database_choice'

export interface ClusterCopy {
  sidebar: string
  inline: { title: string; body: string }
  end: { title: string; body: string }
}

export interface ClusterDef {
  // utm_campaign value. Folded to the report's canonical campaign set:
  // postgres_hosting | serverless_pooling | managed_ops | orm_stack | database_choice
  campaign: string
  // Where the *primary* action points for high-intent (strong) placements.
  destination: Destination
  copy: ClusterCopy
}

// Destination base URLs.
export const PRODUCT_URL = 'https://www.prisma.io/postgres'
export const CONSOLE_URL = 'https://console.prisma.io/login'
export const DOCS_URL = 'https://www.prisma.io/docs/postgres'

export const clusters: Record<ClusterId, ClusterDef> = {
  postgres_hosting: {
    campaign: 'postgres_hosting',
    destination: 'console',
    copy: {
      sidebar: `Need to run this in production? Create a hosted Postgres database in seconds.`,
      inline: {
        title: `Skip the setup with Prisma Postgres`,
        body: `If you want Postgres without provisioning instances, networking, backups, and pooling, Prisma Postgres gives you a hosted database in seconds.`,
      },
      end: {
        title: `Create a hosted Postgres database`,
        body: `Provision a production-ready Postgres database in seconds — no instances, networking, or backups to manage.`,
      },
    },
  },
  serverless_pooling: {
    campaign: 'serverless_pooling',
    destination: 'console',
    copy: {
      sidebar: `Building for serverless or edge? Prisma Postgres has built-in connection pooling.`,
      inline: {
        title: `Built-in pooling with Prisma Postgres`,
        body: `Prisma Postgres includes built-in connection pooling, so serverless and edge apps use a regular Postgres connection string — no separate pooler to run.`,
      },
      end: {
        title: `Try Postgres with built-in pooling`,
        body: `Provision a hosted Postgres database in seconds — connection pooling, automated backups, and Query Insights included.`,
      },
    },
  },
  performance: {
    campaign: 'managed_ops',
    destination: 'console',
    copy: {
      sidebar: `Chasing slow queries? Prisma Postgres surfaces them with Query Insights.`,
      inline: {
        title: `Find slow queries with Query Insights`,
        body: `Prisma Postgres includes Query Insights, so you can spot and fix slow queries on a hosted database without wiring up your own monitoring.`,
      },
      end: {
        title: `Find slow queries with Prisma Postgres`,
        body: `Spot and fix slow queries with built-in Query Insights on a fully managed Postgres database.`,
      },
    },
  },
  managed_ops: {
    campaign: 'managed_ops',
    destination: 'console',
    copy: {
      sidebar: `Tired of managing Postgres operations? Create a managed Postgres database.`,
      inline: {
        title: `Let Prisma Postgres handle the operations`,
        body: `Prisma Postgres provisions a fully managed Postgres database with automated backups and connection pooling — so you can focus on your app, not the infrastructure.`,
      },
      end: {
        title: `Create a managed Postgres database`,
        body: `Hosted Postgres with automated backups, connection pooling, and Query Insights — ready in seconds.`,
      },
    },
  },
  orm_stack: {
    campaign: 'orm_stack',
    destination: 'product',
    copy: {
      sidebar: `Choosing a data layer? Pair Prisma ORM with hosted Prisma Postgres.`,
      inline: {
        title: `Pair Prisma ORM with Prisma Postgres`,
        body: `Pair Prisma ORM with Prisma Postgres for an end-to-end typed data layer — hosted, pooled, and ready in seconds.`,
      },
      end: {
        title: `Build with Prisma ORM and hosted Postgres`,
        body: `Get a type-safe data layer and a hosted Postgres database that work together out of the box.`,
      },
    },
  },
  database_choice: {
    campaign: 'database_choice',
    destination: 'product',
    copy: {
      sidebar: `Need a database for your next project?`,
      inline: {
        title: `Need a hosted database?`,
        body: `When you're ready to deploy, Prisma Postgres gives you a hosted Postgres database in seconds — with pooling and backups built in.`,
      },
      end: {
        title: `Explore Prisma Postgres`,
        body: `A hosted Postgres database for your next project, with connection pooling and backups built in.`,
      },
    },
  },
}
