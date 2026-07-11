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
      name: 'content-only-depends-on-domain',
      from: { path: '^packages/content' },
      to: { path: '^(apps|packages/(simulation|ui|canvas|persistence|platform|testkit))' },
    },
    {
      name: 'no-deep-package-imports',
      from: { path: '^(apps|packages)', pathNot: '^packages/simulation/src/' },
      to: { path: '^packages/[^/]+/src/' },
    },
    {
      name: 'web-never-imports-electron',
      from: { path: '^apps/web' },
      to: { path: '^apps/desktop' },
    },
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
  },
};
