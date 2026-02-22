import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/introduction', 'getting-started/quick-start'],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: ['configuration/environment-variables', 'configuration/storage-providers'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api-reference/authentication', 'api-reference/apps-and-releases', 'api-reference/organizations'],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment/docker', 'deployment/reverse-proxy', 'deployment/gcp-enterprise'],
    },
    {
      type: 'category',
      label: 'Compliance',
      items: ['compliance/fossa-and-sbom'],
    },
  ],
};

export default sidebars;
