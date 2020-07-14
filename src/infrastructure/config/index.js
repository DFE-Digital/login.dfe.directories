'use strict';

const fs = require('fs');
const Path = require('path');

const getSettingsObject = (settings) => {
  try {
    return JSON.parse(settings);
  } catch (e) {
    return null;
  }
};

const getSettingsFromFile = (settingsPath) => {
  if (fs.existsSync(settingsPath)) {
    const file = fs.readFileSync(settingsPath, 'utf8');
    try {
      return JSON.parse(file);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const fetchConfig = () => {
  let settingsObject;

  const settingsPath = Path.resolve('./config/login.dfe.directories.local.json');
  if (fs.existsSync(settingsPath)) {
    settingsObject = getSettingsFromFile(settingsPath);
    if (settingsObject !== null) {
      return settingsObject;
    }
  }

  if (process.env.settings) {
    const settings = process.env.settings;
    settingsObject = getSettingsObject(settings);
    if (settingsObject !== null) {
      return settingsObject;
    }
    const settingsPath = Path.resolve(settings);
    if (fs.existsSync(settingsPath)) {
      settingsObject = getSettingsFromFile(settingsPath);
      if (settingsObject !== null) {
        return settingsObject;
      }
    }
  }

  return null;
};

module.exports = fetchConfig();
