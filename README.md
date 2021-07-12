# Overview

This repository is intended as a playground to calculate and thereby verify some KPIs and metrics defined in the research project [DoDo](https://fraunhofer-iem.github.io/dodo-web/).

## Installation

```bash
$ npm install
```

## Running the app

Start the database by running `docker-compose up -d`. Per default a web interface displaying the current state of the database is launched on `localhost:8081`. The credentials are defined in the docker-compose file.

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Configuration

Create local `.env.local` file in which you store a GitHub access token under the `GITHUB_ACCESS_TOKEN` key. The GitHub REST API is restricted to 60 requests per hour if you don't use any access token and this will be exceeded by one of the predefined queries. For more details of the limited rates see the GitHub [documentation](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting).

## Database
Add the `URI` and user credentials for your database to the `.env.local` file.

```bash
DB_URI=mongodb://localhost:27017/<shouldReflectYourDatabaseDefinedInDockerCompose>
DB_USER=<userName as defined in docker-compose>
DB_USER_PASSWORD=<password as defined in docker-compose>
```

The user credentials have to match the ones defined in the `docker-compose.yml`.

In order to get a clean setup you have to remove the docker volume! Use `docker volume rm visu-code-db-service_mongodb-data` for that.

## Windows Only
Make sure the `mongo-init.sh` is stored with LF line endings!
