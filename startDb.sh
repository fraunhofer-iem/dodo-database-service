#!/bin/bash
docker run --name mongo-db -p 27017:27017 -v "$PWD/data":/data/db mongo
