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
