#!/bin/bash

clear
echo "Creating SSL certs for localhost."

if [ ! -d ssl ]; then
  mkdir -p ssl;

    if [ ! -f ssl/localhost.txt ]; then
        openssl genrsa -out ssl/localhost.key 2048

        openssl req -new -x509 -key ssl/localhost.key -out ssl/localhost.cert -days 3650 -subj /CN=localhost
    fi

fi


