/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EsProvider,
  EsSupertestWithoutAuthProvider,
  SupertestWithoutAuthProvider,
  UsageAPIProvider,
  InfraOpsGraphQLProvider
} from './services';

export default async function ({ readConfigFile }) {

  // Read the Kibana API integration tests config file so that we can utilize its services.
  const kibanaAPITestsConfig = await readConfigFile(require.resolve('../../../test/api_integration/config.js'));
  const xPackFunctionalTestsConfig = await readConfigFile(require.resolve('../functional/config.js'));
  const kibanaCommonConfig = await readConfigFile(require.resolve('../../../test/common/config.js'));

  return {
    testFiles: [require.resolve('./apis')],
    servers: xPackFunctionalTestsConfig.get('servers'),
    services: {
      supertest: kibanaAPITestsConfig.get('services.supertest'),
      esSupertest: kibanaAPITestsConfig.get('services.esSupertest'),
      supertestWithoutAuth: SupertestWithoutAuthProvider,
      esSupertestWithoutAuth: EsSupertestWithoutAuthProvider,
      infraOpsGraphQLClient: InfraOpsGraphQLProvider,
      es: EsProvider,
      esArchiver: kibanaCommonConfig.get('services.esArchiver'),
      usageAPI: UsageAPIProvider,
      kibanaServer: kibanaCommonConfig.get('services.kibanaServer'),
      chance: kibanaAPITestsConfig.get('services.chance'),
    },
    esArchiver: xPackFunctionalTestsConfig.get('esArchiver'),
    junit: {
      reportName: 'X-Pack API Integration Tests',
    },
    kbnTestServer: {
      ...xPackFunctionalTestsConfig.get('kbnTestServer'),
      serverArgs: [
        ...xPackFunctionalTestsConfig.get('kbnTestServer.serverArgs'),
        '--optimize.enabled=false',
      ],
    },
    esTestCluster: xPackFunctionalTestsConfig.get('esTestCluster'),
  };
}
