import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'DeployMate',
  tagline: 'Self-hosted beta app distribution for iOS and Android',
  favicon: 'img/favicon.svg',

  url: 'https://deploymate.dev',
  baseUrl: '/',

  organizationName: 'deploymate',
  projectName: 'deploymate',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/deploymate/deploymate/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'DeployMate',
      logo: {
        alt: 'DeployMate Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/deploymate/deploymate',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs/getting-started/introduction',
            },
            {
              label: 'Quick Start',
              to: '/docs/getting-started/quick-start',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference/authentication',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/deploymate/deploymate',
            },
            {
              label: 'Issues',
              href: 'https://github.com/deploymate/deploymate/issues',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/deploymate/deploymate/discussions',
            },
          ],
        },
      ],
      copyright: 'Copyright 2026 DeployMate Contributors. Apache 2.0.',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'nginx', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
