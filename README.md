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

## Running the unit-test

```bash
$ yarn test

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

## Application Flow

1. **Register**

   - Use the registration endpoint (`POST /auth/signup`) to create a new user. Upon successful registration, a JWT token is generated. This token is required to access other endpoints.

2. **Login**

   - Alternatively, you can use the login endpoint (`POST /auth/signin`) to generate a JWT token. This token is necessary to access other endpoints.

3. **Get all existing books**

   - Use the `GET /public/book` endpoint to retrieve a list of all Books including the quantities. Books that are being borrowed are not counted.

4. **Get all existing users**

   - Use the `GET /public/member` endpoint to retrieve a list of all members along with the number of books currently being borrowed by each member.

5. **Borrowing the Book.**

   - Use the `POST /borrowing/:bookId` endpoint to borrow a Book.

6. **Returning the Book.**

   - Use the `PUT /borrowing/:bookId` endpoint to return a Book.
