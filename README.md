# Overview

This repository is intended as a playground to calculate and verify KPIs and metrics defined in the research project [DoDo](https://fraunhofer-iem.github.io/dodo-web/).
The repository contains a description of the calculated KPIs [here](https://github.com/fraunhofer-iem/dodo-database-service/tree/main/doc/KPIs).

The documentation of the fundamental data model for this KPI system can be accessed [here](https://github.com/fraunhofer-iem/kpi-data-model).

## Further Repositories
An additional project is used to visualize the calculated data and can be found [here](https://github.com/fraunhofer-iem/dodo-github-visualization).\
To deploy the complete setup using docker and adding traefik for routing between the containers you can use this [repository](https://github.com/fraunhofer-iem/dodo-deployment).

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

## OpenApi
The OpenApi description of this API is reachable on the `/api` endpoint.

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
### Run the statistic tests
```bash
$ npm test
```

If you run the newest Linux Version (21) you might run into problems, because the mongodb binary is not found. In this case manually set the binary download url as an environment variable (MONGOMS_DOWNLOAD_URL=https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-5.0.3.tgz).
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
