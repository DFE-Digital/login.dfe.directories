const config = require("./../../../infrastructure/config");

let adapter;
if (config.invitations.type === "sequelize") {
  adapter = require("./sequelizeInvitationStorage");
} else {
  adapter = require("./redisInvitationStorage");
}

module.exports = adapter;
