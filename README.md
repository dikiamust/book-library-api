## book-library-api is a lightweight backend application developed using NestJS, Prisma, and PostgreSQL.

## Clone

```sh
git clone https://github.com/dikiamust/book-library-api

cd book-library-api
```

## Environment Variables

You can see it in the .env.example file

```sh
cp .env.example .env
```

## Installation

```sh
yarn # or yarn install
```

## Database Migration

```sh
# Generate Prisma Client
 yarn db:generate

#  run migration
yarn db:migrate

```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod

```

## API Documentation

After running all the commands above and starting the application, you can access the API documentation at [http://localhost:3000/api-doc](http://localhost:3000/api-doc), which includes information on endpoint usage.
