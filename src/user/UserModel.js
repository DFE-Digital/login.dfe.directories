class UserModel {

  get sub() {
    return this.sub;
  }
  set sub(value) {
    this.sub = value;
  }
  
  get given_name() {
    return this.given_name;
  }
  set given_name(value) {
    this.given_name = value;
  }

  get family_name() {
    return this.family_name;
  }
  set family_name(value) {
    this.family_name = value;
  }

  get email() {
    return this.email;
  }
  set email(value) {
    this.email = value;
  }
  
}

module.exports = UserModel;