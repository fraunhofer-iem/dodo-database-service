# Overview

This repository is intended as a playground to calculate and thereby verify some KPIs and metrics defined in the research project [DoDo](https://fraunhofer-iem.github.io/dodo-web/).

## Installation

```bash
$ npm install
```

## Running the app

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

Use the `startDb.sh` script to spin up a docker container with a mongoDB database, which will be used to store your query results. Add the `URI` for your database to the .env.local file.
This should look like this: `DB_URI=mongodb+srv://dbUser:<dbpassword>@cluster0.dcu5m.mongodb.net/sample_airbnb?retryWrites=true&w=majority`.
