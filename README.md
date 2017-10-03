[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.directories.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.directories)

# login.dfe.directories

## Setup

## Getting Started

Install deps
```
npm i
```

Setup Keystore & development ssl certs
```
npm run setup
```

Run
```
npm run dev
```

## Request Verification

The directories API uses request verification and must share the public key from where the request was made. The 
environment variable ```REQUEST_VERIFICATION_CERT_LOCATION ``` must be set to use any adapter. This is the relative path to the certificate.

## Mongo User Adapter

To use the mongo user adapter you must specify the ``` MONGO_CONNNECTION_URL ``` this is the connection to your mongo instance

A collection call Users must be created.

The document for user must have a "email" field as shown below

```

{
    "_id": "59ca1a1779f1be07edc9fa17",
    "email": "demo@localuser.com",
    "first_name": "Demo",
    "last_name": "Strator"
}

```

### Azure Active Directory Adapter

To use the azure active directory adapter you must specify:
 1) ``` LDAP_URL ``` the ldaps:// url for your active directory.
 1) ``` LDAP_BASE_DN ``` the base DN for the active directory
 1) ``` LDAP_USERNAME ``` the username used for authentication when connecting to the active directory
 1) ``` LDAP_PASSWORD ``` the password for the above user used for authentication when connecting to the active directory