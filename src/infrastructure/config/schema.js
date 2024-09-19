const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const adapterSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['file', 'redis', 'mongo', 'azuread', 'sequelize'],
  },
  params: {
    type: Object,
    optional: true,
    blackbox: true,
    custom: function () {
      if (this.siblingField('type').value === 'sequelize' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
});

const userCodesSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'redis', 'sequelize'],
  },
  params: {
    type: Object,
    optional: true,
    blackbox: true,
    custom: function () {
      if (this.siblingField('type').value !== 'static' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
});

const invitationsSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['sequelize', 'redis'],
  },
  params: {
    type: Object,
    optional: true,
    blackbox: true,
    custom: function () {
      if (this.siblingField('type').value === 'sequelize' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  redisUrl: {
    type: String,
    regEx: patterns.redis,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
});

const devicesSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'redis', 'azureblob', 'sequelize'],
  },
  params: {
    type: Object,
    optional: true,
    blackbox: true,
    custom: function () {
      if (this.siblingField('type').value === 'sequelize' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  redisUrl: {
    type: String,
    regEx: patterns.redis,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  containerUrl: {
    type: String,
    optional: true,
    regEx: /https:\/\/.*/,
    custom: function () {
      if (this.siblingField('type').value === 'azureblob' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
});

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis,
  slackWebHookUrl: String,
  envName: String,
});

const togglesSchema = new SimpleSchema({
  notificationsEnabled: {
    type: Boolean,
    optional: true,
  },
});

const entraSchema = new SimpleSchema({
  useEntraForAccountRegistration: {
    type: Boolean,
    optional: true,
    defaultValue: false,
  },
  cloudInstance: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  tenantId: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  clientId: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  clientSecret: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  graphEndpoint: {
    type: String,
    optional: true,
    defaultValue: '',
  },
});

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  adapter: adapterSchema,
  userCodes: userCodesSchema,
  invitations: invitationsSchema,
  devices: devicesSchema,
  applications: schemas.apiClient,
  auth: schemas.apiServerAuth,
  notifications: notificationsSchema,
  toggles: {
    type: togglesSchema,
    optional: true,
  },
  entra: entraSchema,
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger);
};
