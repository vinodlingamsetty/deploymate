/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular-src',
      comment: 'Avoid circular dependencies in application code.',
      severity: 'warn',
      from: { path: '^src' },
      to: { circular: true }
    }
  ],
  options: {
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    doNotFollow: {
      path: 'node_modules'
    },
    exclude: {
      path: [
        '^docs-site',
        '^dist',
        '^coverage',
        '^\\.next',
        '\\.test\\.ts$',
        '\\.integration\\.test\\.ts$'
      ]
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^(node_modules|src)'
      }
    }
  }
}
