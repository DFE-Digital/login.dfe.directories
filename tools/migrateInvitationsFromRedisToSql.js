const redisStore = require('./../src/app/invitations/data/redisInvitationStorage');
const path = require('path');
const fs = require('fs');

const lpad = (value, length = 2, filler = '0') => {
  const padded = (value || '').toString().padStart(length, filler);
  return padded.length > length ? padded.substr(padded.length - length) : padded;
};
const toSqlString = (text) => {
  if (text) {
    return `'${text.replace(/'/g, '\'\'')}'`;
  }
  return 'NULL';
};
const toSqlDate = (date) => {
  if (date) {
    const yyyy = lpad(date.getUTCFullYear(), 4);
    const mm = lpad(date.getUTCMonth() + 1);
    const dd = lpad(date.getUTCDate());
    const hh = lpad(date.getUTCHours());
    const mi = lpad(date.getUTCMinutes());
    const ss = lpad(date.getUTCSeconds());

    return `'${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}'`;
  }
  return 'GETDATE()';
};
const writeInvitation = (invitation, write) => {
  write('-------------------------------------------------------------------------------------------------------------------------\n');
  write(`--- Invitation ${invitation.id} (for ${invitation.email})\n`);
  write('-------------------------------------------------------------------------------------------------------------------------\n');

  write('INSERT INTO invitation\n');
  write('(id, email, code, firstName, lastName, originClientId, originRedirectUri, selfStarted, overrideSubject, overrideBody, ');
  write('previousUsername, previousPassword, previousSalt, deactivated, reason, completed, uid, createdAt, updatedAt)\n');
  write('VALUES\n');
  write(`('${invitation.id}'`);
  write(`, '${invitation.email.replace(/'/g, '\'\'')}'`);
  write(`, '${invitation.code}'`);
  write(`, '${invitation.firstName.replace(/'/g, '\'\'')}'`);
  write(`, '${invitation.lastName.replace(/'/g, '\'\'')}'`);
  write(`, ${toSqlString(invitation.origin ? invitation.origin.clientId : undefined)}`);
  write(`, ${toSqlString(invitation.origin ? invitation.origin.redirectUri : undefined)}`);
  write(`, ${invitation.selfStarted ? 1 : 0}`);
  write(`, ${toSqlString(invitation.overrides ? invitation.overrides.subject : undefined)}`);
  write(`, ${toSqlString(invitation.overrides ? invitation.overrides.body : undefined)}`);
  write(`, ${toSqlString(invitation.oldCredentials ? invitation.oldCredentials.username : undefined)}`);
  write(`, ${toSqlString(invitation.oldCredentials ? invitation.oldCredentials.password : undefined)}`);
  write(`, ${toSqlString(invitation.oldCredentials ? invitation.oldCredentials.salt : undefined)}`);
  write(`, ${invitation.deactivated ? 1 : 0}`);
  write(`, ${toSqlString(invitation.reason)}`);
  write(`, ${invitation.isCompleted ? 1 : 0}`);
  write(`, ${toSqlString(invitation.userId)}`);
  write(`, ${toSqlDate(invitation.createdAt)}`);
  write(`, ${toSqlDate(invitation.updatedAt)}`);
  write(')\n\n');
};
const writeInvitationCallbacks = (invitation, write) => {
  if (!invitation.callbacks) {
    return;
  }

  for (let i = 0; i < invitation.callbacks.length; i += 1) {
    write('INSERT INTO invitation_callback\n');
    write('(invitationId, sourceId, callbackUrl, createdAt, updatedAt)\n');
    write('VALUES\n');
    write(`('${invitation.id}'`);
    write(`, '${invitation.callbacks[i].sourceId}'`);
    write(`, '${invitation.callbacks[i].callback}'`);
    write(`, ${toSqlDate(invitation.updatedAt)}`);
    write(`, ${toSqlDate(invitation.updatedAt)}`);
    write(')\n\n');
  }
};
const writeInvitationDevices = (invitation, write) => {
  let serialNumber;

  if (invitation.device) {
    serialNumber = invitation.device.serialNumber;
  } else if (invitation.oldCredentials && invitation.oldCredentials.tokenSerialNumber) {
    serialNumber = invitation.oldCredentials.tokenSerialNumber;
  } else if (invitation.tokenSerialNumber) {
    serialNumber = invitation.tokenSerialNumber;
  }

  if (serialNumber) {
    write('INSERT INTO invitation_device\n');
    write('(id, invitationId, deviceType, serialNumber, createdAt, updatedAt)\n');
    write('VALUES\n');
    write('(NEWID()');
    write(`, '${invitation.id}'`);
    write(', \'digipass\'');
    write(`, '${serialNumber}'`);
    write(`, ${toSqlDate(invitation.updatedAt)}`);
    write(`, ${toSqlDate(invitation.updatedAt)}`);
    write(')\n\n');
  }
};

const migrate = async () => {
  const { invitations } = await redisStore.list(1, 9999999);
  let sql = '';
  const write = (chunk) => sql += chunk;
  for (let i = 0; i < invitations.length; i += 1) {
    writeInvitation(invitations[i], write);
    writeInvitationCallbacks(invitations[i], write);
    writeInvitationDevices(invitations[i], write);
    write('\n');
  }

  const savePath = path.join(path.resolve('./'), 'app_data', 'create_invitations_from_redis.sql');
  fs.writeFileSync(savePath, sql, 'utf8');

  return savePath;
};
migrate().then((savePath) => {
  console.info(`done. saved to ${savePath}`);
}).catch((e) => {
  console.error(e.stack);
}).then(() => {
  process.exit();
});