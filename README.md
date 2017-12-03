[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.directories.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.directories)

[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

[![VSTS Build Status](https://sfa-gov-uk.visualstudio.com/_apis/public/build/definitions/aa44e142-c0ac-4ace-a6b2-0d9a3f35d516/705/badge)](https://sfa-gov-uk.visualstudio.com/DfE%20New%20Secure%20Access/_build/index?definitionId=705&_a=completed)

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

To use the mongo user adapter you must specify an adapter configuration with mongo connection as shown below:

``` 
"adapter":
  {
    "id": "ff080eff-b525-4215-a11f-f5b37eefad45",
    "type": "mongo",
    "params": {
      "mongoConnection": ""
    }
  
```
 
 
 the ``` mongoConnection ``` is the connection to your mongo instance

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
 
 
 ### Redis User Adapter
 
 To use the redis user adapter you must specify the following adapter configuration
 
 ``` 
 "adapter":
   {
     "id": "9af9f8a2-ceec-461f-8db4-ff37073903df",
     "type": "redis",
     "params": {
       "redisurl": ""
     }
   
 ```
  
 The redis url is the connection to your repository. Within this a collection called Users should be created with the following keys
 
```
[
	{
		"sub": "11d62132-6570-4e63-9dcb-137cc35e7543",
		"email": "foo@example.com"
	},
	{
		"sub": "a8e11610-eb2d-4ead-a199-b5acea3b8628",
		"email": "test@tester.com"
	}
]
```

Then a corresponding User_[Sub] record should be created as shown

```
{
	"sub": "11d62132-6570-4e63-9dcb-137cc35e7543",
	"email": "foo@example.com",
	"given_name": "Roger",
	"family_name": "Johnson",
	"password": "xxxx",
	"salt": "zzzzzzz"
}
```

In this instance the document would be called **User_11d62132-6570-4e63-9dcb-137cc35e7543**
 
To use the password reset functionality the user codes configuration needs adding as shown

```
"userCodes" :{
    "redisUrl" :"redis://localhost:6379",
    "staticCode" : false
  },
```
This will then store a code to be used for actions like password reset. If the staticCode param is set to true, then every code
will return as ABC123. 
 
 
 ### Available API methods
 
To determine which user adapter to use, an adapter type must be added of one of the following supported types:

1) file - *uses users.json in app_data*
2) mongo
3) redis
4) azure

This can then be in the following format for each type

```
adapter: {
  type: 'file'
},
```


```
adapter: {
  "type": "mongo",
  "params": {
    "mongoConnection": ""
  }
}
```

```
adapter: {
   "type": "azuread",
   "params": {
     "url": "",
     "baseDN": "",
     "username": "",
     "password": ""
   }
 },

```

```
adapter: {
    "type": "redis",
    "params": {
      "redisurl": "redis://127.0.0.1:6379/0"
}
```

the api calls then follow the pattern of:

``` GET: /:directoryId/user/:username ```

eg

``` /test2/user/test@user.com ``` to find a user by username using mongo db 

or 

``` POST: /:directoryId/user/authenticate ```

where the body should be

```
{
    "username":"test@test.com",
    "password":"Password1"
}
```

For change password

``` POST: /:directoryId/user/:id/changepassword ```

where the body should be

```
{
    "password": "my-new-password"
}
```

Where uid is the users id, and password is the value you wish to change the users password to


#### User codes API

There is also an endpoint available for requesting and validating user codes

``` PUT: /upsert  ```

Where the body should be:

```
{
    "uid": "123ASDFVCD",
    "clientId": "client1"
}
```

This will then return back a code in the body. The client relates to the directory store for 
the user and application they are accessing


``` GET: /validate/:uid/:code  ```

This will return true or false depending on whether the code is valid or not

``` DELETE: /:uid  ```

This will delete a code associated to the uid