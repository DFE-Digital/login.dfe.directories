const fs = require('fs');
const os = require('os');
const path = require('path');

require('dotenv').config();

const config = {
  loggerSettings: {
    applicationName: "Directories-API",
    logLevel: "info",
    auditDb: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  hostingEnvironment: {
    env: process.env.LOCAL_ENV || "azure",
    host: process.env.LOCAL_HOST || process.env.STANDALONE_DIRECTORIES_HOST_NAME,
    port: process.env.LOCAL_PORT_DIRECTRORIES || 443,
    sslCert: process.env.LOCAL_SSL_CERT ? process.env.LOCAL_SSL_CERT.replace(/\\n/g, '\n') : "",
    sslKey: process.env.LOCAL_SSL_KEY ? process.env.LOCAL_SSL_KEY.replace(/\\n/g, '\n') : "",
    protocol: "https",
    applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    agentKeepAlive: {
      maxSockets: 25,
      maxFreeSockets: 5,
      timeout: 60000,
      keepAliveTimeout: 30000
    }
  },
  adapter: {
    type: "sequelize",
    params: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_DIR,
      password: process.env.SVC_SIGNIN_DIR_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_DIRECTORIES_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  userCodes: {
    type: "sequelize",
    params: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_DIR,
      password: process.env.SVC_SIGNIN_DIR_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_DIRECTORIES_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  invitations: {
    type: "sequelize",
    params: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_DIR,
      password: process.env.SVC_SIGNIN_DIR_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_DIRECTORIES_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    redisUrl: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/1" : process.env.REDIS_CONN + "/1"
  },
  applications: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_APPLICATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  auth: {
    type: "aad",
    identityMetadata: process.env.TENANT_URL + "/.well-known/openid-configuration",
    clientID: process.env.AAD_SHD_APP_ID
  },
  notifications: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true",
    slackWebHookUrl: process.env.PLATFORM_GLOBAL_SLACK_FEED,
    envName: process.env.ENVIRONMENT_NAME,
    genericEmailStrings: JSON.parse(process.env.GENERIC_EMAIL_STRINGS ?? '[]'),
    supportTeamEmail: process.env.SUPPORT_TEAM_EMAIL,
  },
  toggles: {
    notificationsEnabled: true
  },
  entra: {
    cloudInstance: process.env.ENTRA_CLOUD_INSTANCE,
    tenantId: process.env.ENTRA_TENANT_ID,
    clientId: process.env.DFE_SIGNIN_HYBRID_INTEGRATION_APP_CLIENT_ID,
    clientSecret: process.env.DFE_SIGNIN_HYBRID_INTEGRATION_APP_SECRET,
    graphEndpoint: process.env.ENTRA_GRAPH_ENDPOINT
  }
}

// Persist configuration to a temporary file and then point the `settings` environment
// variable to the path of the temporary file. The `login.dfe.dao` package can then load
// this configuration.
function mimicLegacySettings(config) {
  // TODO: This can be improved by refactoring the `login.dfe.dao` package.
  const tempDirectoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'config-'));
  const tempConfigFilePath = path.join(tempDirectoryPath, 'config.json');

  fs.writeFileSync(tempConfigFilePath, JSON.stringify(config), { encoding: 'utf8' });
  process.env.settings = tempConfigFilePath;
}

mimicLegacySettings(config);

module.exports = config;
