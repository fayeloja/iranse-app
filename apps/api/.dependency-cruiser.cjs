module.exports = {
  forbidden: [
    {
      name: 'no-cross-module-violations',
      comment: 'Enforces that modules inside src/modules/ do not violate modular boundaries.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/'
      },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: [
          // Allow modules to import from their own folder
          '^src/modules/$1/',
          // Permitted dependencies:
          // 1. matching needs job-discovery and career-profile
          '^src/modules/job-discovery/',
          '^src/modules/career-profile/',
          // 2. application-materials needs job-discovery and career-profile
          '^src/modules/application-materials/',
          // 3. applications needs application-materials, identity, and job-discovery
          '^src/modules/identity/'
        ]
      }
    },
    {
      name: 'no-module-to-infra-leak',
      comment: 'Modules must not bypass the standard infrastructure abstraction layers.',
      severity: 'error',
      from: {
        path: '^src/modules/'
      },
      to: {
        path: '^src/infra/',
        // Allow standard entrypoints but block direct internal file bypasses if any
        pathNot: [
          '^src/infra/database/',
          '^src/infra/queue/',
          '^src/infra/rate-limiter/',
          '^src/infra/embeddings/',
          '^src/infra/encryption/',
          '^src/infra/kyc-client/',
          '^src/infra/payments/',
          '^src/infra/logger/'
        ]
      }
    }
  ],
  options: {
    doNotFollow: 'node_modules',
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
