const config = require('./../src/infrastructure/config');
const path = require('path');
const fs = require('fs');
const IORedis = require('ioredis');

const redis = new IORedis(config.devices.redisUrl, { tls: true });

const readBatchOfKeys = async ({ match = '*', count = 0 }) => {
  return new Promise((resolve, reject) => {
    const keys = [];
    const opts = {
      match,
    };

    if (count > 0) {
      opts.count = count;
    }

    redis.scanStream(opts)
      .on('data', (batch) => {
        for (let i = 0; i < batch.length; i += 1) {
          keys.push(batch[i]);
        }
      })
      .on('end', () => {
        resolve(keys);
      })
      .on('error', reject);
  });
};
const getAllUserDeviceMappings = async () => {
  const mappings = [];
  const allKeys = await readBatchOfKeys({ match: 'UserDevices_*' });
  for (let i = 0; i < allKeys.length; i += 1) {
    const userId = allKeys[i].substr(12);
    const json = await redis.get(`UserDevices_${userId}`);
    if (!json) {
      return [];
    }
    const devices = json ? JSON.parse(json) : [];
    mappings.push({
      userId,
      devices,
    });
  }
  return mappings;
};const toSqlDate = (date) => {
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

const writeUserMappings = (userMappings, write) => {
  write('-------------------------------------------------------------------------------------------------------------------------\n');
  write(`--- Mappings for ${userMappings.userId}\n`);
  write('-------------------------------------------------------------------------------------------------------------------------\n');

  for (let i = 0; i < userMappings.devices.length; i += 1) {
    const device = userMappings.devices[i];

    write('INSERT INTO user_device\n');
    write('(id, uid, deviceType, serialNumber, createdAt, updatedAt)\n');
    write('VALUES\n');
    write(`('${device.id}'`);
    write(`, '${userMappings.userId}'`);
    write(`, '${device.type}'`);
    write(`, '${device.serialNumber}'`);
    write(', GETDATE()');
    write(', GETDATE()');
    write(')\n\n');
  }
};

const migrate = async () => {
  const mappings = await getAllUserDeviceMappings();
  let sql = '';
  const write = (chunk) => sql += chunk;
  for (let i = 0; i < mappings.length; i += 1) {
    writeUserMappings(mappings[i], write);
    write('\n');
  }

  const savePath = path.join(path.resolve('./'), 'app_data', 'create_devices_from_redis.sql');
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