module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      from: { path: '^packages/domain' },
      to: { path: '^(apps|packages/(ui|platform|persistence))' },
    },
    {
      name: 'simulation-is-headless',
      from: { path: '^packages/simulation' },
      to: { path: '^(apps|packages/(ui|platform))' },
    },
    {
      name: 'web-never-imports-electron',
      from: { path: '^apps/web' },
      to: { path: '^apps/desktop' },
    },
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsPreCompilationDeps: true },
};
