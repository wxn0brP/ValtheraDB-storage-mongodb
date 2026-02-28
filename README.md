# ValtheraDB-storage-mongodb

A ValtheraDB compatible storage adapter that uses MongoDB as a backend.

This allows you to use the ValtheraDB API and its relational engine with a powerful and scalable MongoDB database.

## Installation

```bash
bun i github:wxn0brP/ValtheraDB-storage-mongodb
```

## Usage

```typescript
import { VdbMongo } from '@wxn0brp/db-storage-mongodb';

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'my-app-db';

const db = new VdbMongo(MONGO_URI, DB_NAME, true);

try {
    const newUser = await db.add('users', { name: 'John Doe', age: 30 });
    console.log(newUser);
} finally {
    await db.close();
}
```
