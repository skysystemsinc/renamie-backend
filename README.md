<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Renamie Backend - NestJS API

A comprehensive NestJS backend API with MongoDB, JWT authentication, and modular architecture.

## 🚀 Features

- **Modular Architecture**: Each feature (users, auth, products) is a separate NestJS module
- **MongoDB Integration**: Using Mongoose with repository pattern
- **JWT Authentication**: Complete auth system with refresh tokens
- **Role-Based Access Control**: Admin and user roles with guards
- **Validation**: DTOs with class-validator
- **Error Handling**: Global exception filter with consistent responses
- **Logging**: Winston-based logging service
- **Health Check**: Service monitoring endpoint
- **Environment Configuration**: Centralized config management

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
│   ├── configuration.ts    # Main configuration
│   ├── database.config.ts  # Database configuration
│   └── jwt.config.ts      # JWT configuration
├── common/                 # Shared components
│   ├── dto/               # Common DTOs
│   ├── filters/           # Exception filters
│   └── services/          # Shared services (logger)
├── database/              # Database module
├── users/                 # Users module
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── dto/
│   └── schemas/
├── auth/                  # Authentication module
│   ├── controllers/
│   ├── services/
│   ├── strategies/
│   ├── guards/
│   ├── decorators/
│   └── dto/
├── products/              # Products module
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── dto/
│   └── schemas/
└── health/                # Health check module
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd renamie-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Application
   PORT=3000
   NODE_ENV=development
   
   # Database
   MONGO_URI=mongodb://localhost:27017/renamie-backend
   
   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Logging
   LOG_LEVEL=info
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access-token>
```

### User Management (Admin Only)

#### Get All Users
```http
GET /users
Authorization: Bearer <access-token>
```

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <access-token>
```

#### Create User
```http
POST /users
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "admin"
}
```

#### Update User
```http
PATCH /users/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Updated Name"
}
```

#### Delete User
```http
DELETE /users/:id
Authorization: Bearer <access-token>
```

### Product Management

#### Get All Products
```http
GET /products
```

#### Get Product by ID
```http
GET /products/:id
```

#### Get Products by Category
```http
GET /products/category/:category
```

#### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 10,
  "category": "electronics",
  "tags": ["new", "featured"]
}
```

#### Update Product (Admin Only)
```http
PATCH /products/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "price": 89.99
}
```

#### Delete Product (Admin Only)
```http
DELETE /products/:id
Authorization: Bearer <access-token>
```

### Health Check
```http
GET /health
```

## 🔐 Authentication & Authorization

### JWT Tokens
- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Long-lived (7 days) for token renewal

### Roles
- **USER**: Basic user permissions
- **ADMIN**: Full access to all endpoints

### Protected Routes
- User management endpoints require ADMIN role
- Product creation/update/deletion require ADMIN role
- Authentication required for protected routes

## 🏗️ Architecture Patterns

### Repository Pattern
Each module uses a repository layer for database operations:
- `UserRepository` for user operations
- `ProductRepository` for product operations

### Service Layer
Business logic is contained in service classes:
- `UserService` for user business logic
- `AuthService` for authentication logic
- `ProductService` for product business logic

### DTOs and Validation
- Input validation using `class-validator`
- Consistent API responses using `ApiResponseDto`
- Type-safe data transfer objects

### Error Handling
- Global exception filter for consistent error responses
- Proper HTTP status codes
- Detailed error messages

## 🔧 Configuration

### Environment Variables
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Access token expiration
- `JWT_REFRESH_SECRET`: Refresh token secret
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration
- `LOG_LEVEL`: Logging level

### Database Configuration
- MongoDB with Mongoose ODM
- Connection pooling
- Automatic reconnection
- Schema validation

## 📝 Logging

The application uses Winston for logging:
- Console output in development
- File-based logging in production
- Structured JSON logs
- Error tracking with stack traces

## 🚀 Deployment

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- Environment variables configured

### Production Build
```bash
npm run build
npm run start:prod
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secrets
4. Configure logging level

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the logs for debugging
