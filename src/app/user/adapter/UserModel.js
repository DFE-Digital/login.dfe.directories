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

  get job_title() {
    return this._job_title;
  }

  set job_title(value) {
    this._job_title = value;
  }

  get prev_login() {
    return this._prev_login;
  }

  set prev_login(value) {
    this._prev_login = value;
  }

  get legacyUsername() {
    return this._legacyUsername;
  }

  set legacyUsername(value) {
    this._legacyUsername = value;
  }

  get password_reset_required() {
    return this._password_reset_required;
  }

  set password_reset_required(value) {
    this._password_reset_required = value;
  }

  get is_entra() {
    return this._is_entra;
  }

  set is_entra(value) {
    this._is_entra = value;
  }

  get entra_oid() {
    return this._entra_oid;
  }

  set entra_oid(value) {
    this._entra_oid = value;
  }

  get entra_linked() {
    return this._entra_linked;
  }

  set entra_linked(value) {
    this._entra_linked = value;
  }
}

module.exports = UserModel;
