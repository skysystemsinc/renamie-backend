# API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access-token>
```

## Response Format

All API responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

#### POST /auth/logout
Logout user (requires authentication).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Users (Admin Only)

#### GET /users
Get all users (requires ADMIN role).

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /users/:id
Get user by ID (requires ADMIN role).

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /users
Create new user (requires ADMIN role).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "admin"
}
```

#### PATCH /users/:id
Update user (requires ADMIN role).

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "email": "updated@example.com"
}
```

#### DELETE /users/:id
Delete user (requires ADMIN role).

### Products

#### GET /products
Get all active products.

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 10,
      "category": "electronics",
      "tags": ["new", "featured"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /products/:id
Get product by ID.

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "product_id",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "stock": 10,
    "category": "electronics",
    "tags": ["new", "featured"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /products/category/:category
Get products by category.

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 10,
      "category": "electronics",
      "tags": ["new", "featured"],
      "isActive": true
    }
  ]
}
```

#### POST /products
Create new product (requires ADMIN role).

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 10,
  "category": "electronics",
  "tags": ["new", "featured"]
}
```

#### PATCH /products/:id
Update product (requires ADMIN role).

**Request Body:**
```json
{
  "price": 89.99,
  "stock": 15
}
```

#### DELETE /products/:id
Delete product (requires ADMIN role).

### Health Check

#### GET /health
Check service health.

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "email must be an email",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Invalid credentials",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied",
  "error": "Access denied",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "User not found",
  "error": "User not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Internal server error",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate Resource)
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.
