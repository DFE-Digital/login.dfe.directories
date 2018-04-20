class UserModel {
  get sub() {
    return this._sub;
  }
  set sub(value) {
    this._sub = value;
  }

  get given_name() {
    return this._given_name;
  }
  set given_name(value) {
    this._given_name = value;
  }

  get family_name() {
    return this._family_name;
  }
  set family_name(value) {
    this._family_name = value;
  }

  get email() {
    return this._email;
  }
  set email(value) {
    this._email = value;
  }
  get legacyUsername() {
    return this._legacyUsername;
  }
  set legacyUsername(value) {
    this._legacyUsername = value;
  }
}

module.exports = UserModel;
