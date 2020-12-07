---
title: 'Top 8 TypeScript ORMs, Query Builders, & Database Libraries: Evaluating Type Safety'
metaTitle: 'Top 8 TypeScript ORMs, Query Builders, Libraries: Evaluate Type Safety'
metaDescription: "This article assesses the type safety of popular TypeScript ORMs, query builders, and database libraries."
metaImage: '/content/database-tools/type-safety-comparison/meta-orms.png'
---

## Introduction

Evaluating the level of type safety a TypeScript ORM provides out-of-the-box can be time consuming. This article briefly assesses the type safety of libraries considered in [Top 11 Node.js ORMs, Query Builders & Database Libraries in 2020](https://www.prisma.io/dataguide/database-tools/top-nodejs-orms-query-builders-and-database-libraries-in-2020).

While all of the libraries considered in this article have TypeScript bindings for their API, they vary wildly in the level of type safety they _actually_ provide. Some, like [Waterline](https://waterlinejs.org/), compile without errors but then pass around `any` types liberally, skipping over any sort of type checking. Conversely, others, like [Prisma.io](https://www.prisma.io/), have full type safety for advanced functions like partial queries that change the shape of return data.

This article will look at the following:

* **Source**: Are library type definitions officially built-in, or sourced from the [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) @types repository? 
* **Record Creation:** Are models type-safe and can records be created in a type-safe manner? 
* **Record Fetching**: When fetching data, are objects type-safe, even for partial models and relations? 

This article will assume some familiarity with TypeScript and type safety. To learn more, please consult the official [TypeScript documentation](https://www.typescriptlang.org/docs). It will also assume some familiarity with ORMs and query builders. To learn more about these database tools, please see [Comparing SQL, query builders, and ORMs](https://www.prisma.io/dataguide/types/relational/comparing-sql-query-builders-and-orms), also from Prisma's [Data Guide](https://www.prisma.io/dataguide/).

## Prisma

### Evaluation summary

* **Type definitions**: Built-in
* **Record creation**: Type-safe
* **Record fetching**: Type-safe

### Overview

* [Website](https://www.prisma.io/)
* [GitHub](https://github.com/prisma/prisma)
* [npm: @primsa/client](https://www.npmjs.com/package/prisma)

Prisma differs from most ORMs in that models are not defined in classes but in the *Prisma schema*, the main configuration and data model definition file used by the Prisma toolkit. In the Prisma schema you define your data source, like a PostgreSQL database, and models, like `users` and `posts` and the relations between them. Using this schema, Prisma generates a type-safe *Client* that exposes a Create-Read-Update-Delete (CRUD) API, which you then use to query your database. This Prisma Client functions as a rich query builder that you can use in your Node.js app to return plain JavaScript objects, not instances of a model class.

Prisma is a newer database tool and has gone through several iterations and redesigns, its unique, schema-centric architecture stands in contrast to typical ORMs which use Classes to define models. It allows developers to reap some of the rewards of type safety, even in JavaScript Node.js applications. For a deeper dive into Prisma’s type safety, please see [Productive Development With Prisma’s Zero-Cost Type Safety](https://dev.to/prisma/productive-development-with-prisma-s-zero-cost-type-safety-4od2). 

### Type Definitions: Built-in

Prisma client's type definitions are auto-generated when generating the client. The models defined in the Prisma schema (like `User` and `Post`) are automatically exported as types in a generated `index.d.ts` file, readily enabling full type safety when querying data.

### Record Creation: Type-safe

When creating a new record with Prisma, attempting to add properties not defined in the model results in a type error. Model properties are autocompleted. Furthermore, nested writes are also type safe. Nested writes insert data into multiple tables using relations. This means that when creating a `User` and a nested `Post` using the same `prisma.user.create()` call, the `Post` model fields are also type-checked and autocompleted, guaranteeing that the nested record will also be valid.

### Record Fetching: Type-safe

When fetching records from the database, return objects are fully typed, even for relation queries. For example, when fetching all users from the database and including the post relation to additionally fetch all of a user's posts, the type is inferred as `(User & {posts: Post[];})[]`. Furthermore autocomplete also works when using `include` to add fetched relations, so that you can't query relations that don't exist, a feature lacking from many of the libraries considered in this article.

To further demonstrate the level of type safety Prisma builds in, consider a partial query, where only certain properties are queried, changing the return object's type:

```javascript
const usersWithPartialPosts = await prisma.user.findMany({
  include: {
    posts: {
      select: {
        title: true,
        published: true,
      },
    },
  },
})
```

In this query, all users are returned, but only the `title` and `published` fields are selected for the `posts` relation model. `usersWithPartialPosts` is then typed as:

```javascript
(User & {
    posts: {
        title: string;
        published: boolean;
    }[];
})[]
```

This means that attempting to access `post` fields that weren't selected, like `content`, will fail. Prisma is the only ORM-like library considered in this article that is able to achieve this granularity of type safety.

### Type Safety: Strong

Prisma's unique design of generating a local CRUD client that encodes your data model allows it to achieve an unparalleled level of type safety among TypeScript ORMs. When using Prisma to manipulate and query data from your database, you'll have accurate typings for nested relation queries and also partial queries that modify the shape of returned models. 

## Sequelize

### Evaluation summary

* **Type definitions**: Built-in
* **Record creation**: Not Type-safe
* **Record fetching**: Not Type-safe

### Overview

* [Website](https://sequelize.org/)
* [GitHub](https://github.com/sequelize/sequelize/)
* [npm: sequelize](https://www.npmjs.com/package/sequelize)

Sequelize is an established, mature, promise-based Node.js ORM that supports Postgres, MySQL, MariaDB, SQLite, and Microsoft SQL Server. It follows a traditional ORM ActiveRecord pattern of defining models by extending a base `Model` class. Operations like `SELECT` and `INSERT` are then performed using class methods. Relations are also defined using class methods like `hasMany()` and `belongsTo()`. It is very popular in the JavaScript community and has been around for a long time. However, the project has stagnated more recently and does not seem to be as active as it once was.

### Type Definitions: Built-in

As of v5 (at the time of writing, Sequelize is v6.3.5), Sequelize contains built-in type definitions. Prior to this, type definitions were available via [`@types`](https://github.com/DefinitelyTyped/DefinitelyTyped). Sequelize was originally designed as a JavaScript ORM, and TypeScript support was added in recent years.

### Record Creation: Not Type-Safe

Out-of-the-box, Sequelize will not provide strict type-checking for model properties. To implement this, the developer must write a [non-trivial](https://sequelize.org/master/manual/typescript.html) amount of boilerplate including `interfaces`, classes and definitions for CRUD methods for any relations. For complex data models with multiple relations, this can quickly become cumbersome and unwieldy. When creating records using mixins added to models or using nested models, it is again up to the developer to provide type definitions. 

Sequelize also allows you to define models without type checking their attributes. Using this approach, you can get up and running quickly with Sequelize and TypeScript, but lose all type safety when working with your data.

### Record Fetching: Not Type-Safe

Given that Sequelize allows both strict and loose type checking of model attributes, the compiler will only correctly type check queries if the developer provides all of the necessary type definitions. Furthermore, when fetching associations using `include`, the return type does not include information about the nested shape of the fetched data, and to properly compile without errors, the developer must use `!` non-null assertions and `rejectOnEmpty` parameters to override the compiler.

### Type Safety: Weak

As of v5, Sequelize provides built-in type definitions, but to have any sort of real type safety when working with models and records, the onus is on the developer to write interfaces and fully define typings for associations and classes. Out-of-the-box, not much type safety is provided.

## TypeORM

### Evaluation summary

* **Type definitions**: Built-in
* **Record creation**: Type-safe
* **Record fetching**: Partially Type-safe

### Overview

* [Website](https://typeorm.io/#/)
* [GitHub](https://github.com/typeorm)
* [npm: TypeORM](https://www.npmjs.com/package/typeorm)

TypeORM is a Hibernate-influenced JavaScript and TypeScript ORM that can run on multiple platforms like Node.js, web browsers, and Cordova. It was built with TypeScript and type safety in mind and supports both main ORM architecture patterns, Data Mapper and Active Record, offering the developer flexibility to choose between the two. It also includes a query builder and supports many popular databases.

### Type Definitions: Built-in

TypeORM is a TypeScript-first ORM that was explicitly designed for use with TypeScript. Types are built-in to the library and it leverages TypeScript features like decorators when defining models. 

### Record Creation: Type safe

With TypeORM, models are defined using the `Entity` class. You decorate a model class (like `User`) with the `@Entity()` decorator, and decorate its properties like `id` and `name` with column decorators like `@PrimaryGeneratedColumn()` and `@Column`. If you're using the DataMapper pattern, a record is then defined by creating a new instance of the now type-safe model class and setting its properties. The record is saved using a model-specific `Repository` object, which is also typed. 

Nested writes are accomplished by creating an instance of the related class (for example a `Post` for a `User`) and then saving both the `User` and `Post` objects. Using the `cascade` feature, this can be done with one `save` call. With TypeORM, model type-safety is available out-of-the-box.

Using the query builder, model properties are also type-checked:

```javascript
await conn
    .createQueryBuilder()
    .insert()
    .into(User)
    .values([
        { firstName: "Timber", lastName: "Saw" },
        { firstName: "Phantom", lastName: "Lancer" }
     ])
    .execute();
```

If the `User` class does not have a `firstName` field, the compiler will emit an error.

When using relations with the query builder, type safety breaks down as the following does not emit a compiler error:

```javascript
await conn
    .createQueryBuilder()
    .relation(User, "postsssss")
    .of(user)
    .add(post);
```

Even though there is no valid `postssss` relation.

### Record Fetching: Partially type safe

Fetching records from the database can be accomplished in many different ways. Using typed, model-specific `Repository` objects,  the developer calls a method on the repository like `userRepo.find()`, where the return type is correctly inferred as `User[]`. 

When including relations like `userRepo.find({relations: ["posts"]});` , the return type is still inferred as `User[]` and the compiler is not aware of the included relation. It is up to the developer to access the `user.posts` property in a defensive manner.

Using the built-in query builder, a query like the following is typed as `User`:

```javascript
const firstUser = await conn
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .getOne();
```

And in a query like the following:

```javascript
const user = await conn.manager.findOne(User, 1);
user.photos = await getConnection()
    .createQueryBuilder()
    .relation(User, "photos")
    .of(user) // you can use just post id as well
    .loadMany();
```

The type of `user.photos` is `Photo[]`. 

### Type Safety: Strong

TypeORM is TypeScript ORM with good type safety around its models. Its query builder also has a good level of type safety. Type safety for relations is less strict and it is up to the developer to program defensively against this limitation.

## Bookshelf.js

### Evaluation summary

* **Type definitions**: @types
* **Record creation**: Not Type-safe
* **Record fetching**: Not Type-safe

### Overview

* [Website](https://bookshelfjs.org/)
* [GitHub](https://github.com/bookshelf/bookshelf)
* [npm: Bookshelf](https://www.npmjs.com/package/bookshelf)

Bookshelf.js is Node.js ORM built on top of the Knex.js query builder library. It is inspired by the Data Mapper ORM pattern and provides a pared-down interface for modeling and interacting with your data. Bookshelf.js gives you the standard set of data modeling, querying, and manipulation tools. Since it's built on top of the Knex.js query builder, you can always drop down and write more involved queries if you find yourself limited by its interface. It is not as active a project as some of the other tools considered in this article, but has been around for a long time and has a core user base that prefers its streamlined style.

### Type Definitions: [@types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/30813acabce6fce9fcd6871421784a9113662fe3/types/bookshelf/index.d.ts)

Type definitions for Bookshelf.js can be found in the [Definitely Typed](https://github.com/DefinitelyTyped/DefinitelyTyped) repository of TypeScript type definitions. They are not built-in to the library.

### Record Creation: Not type-safe

Bookshelf.js models are created by extending the `bookshelf.Model` class or calling `bookshelf.model()` with a model and table name. The tables and schema must be created beforehand and are not defined within these models. For example, after creating a `User` model that corresponds to table name `users`, to set the `name` property, the developer would call `user.set('name', 'Joe')`. If the `name` column does not exist in the `users` table, then this call will fail at runtime. As such, model creation in Bookshelf is not type safe out-of-the-box. The type of most objects passed around is `any`.

### Record Fetching: Not type-safe

Given the above, it is no surprise that fetching records from the database is also not type safe. When fetching a `user` record using `const user = await User.where({'name': 'Joe'}).fetch();`, the resulting type is `any`. Including relations using `withRelated` within a `fetch()` does not change this. Query parameters in the `where()` clause are not type checked and if you include a column that does not exist in the database, the command will pass compilation but fail at run time.

### Type Safety: Weak

Although Bookshelf.js does have `@types` type definitions, these provide the bare minimum to compile TypeScript code without errors. If you're looking to work with a Knex.js-based ORM-like library with strong TypeScript support, both Objection.js and MikroORM provide thorough type safety and are better supported and maintained.

## Objection.js

### Evaluation summary

* **Type definitions**: Built-in
* **Record creation**: Type-safe
* **Record fetching**: Partially Type-safe

### Overview

* [Website](https://vincit.github.io/objection.js/)
* [GitHub](https://github.com/Vincit/objection.js)
* [npm: Objection](https://www.npmjs.com/package/objection)

Objection.js is self-described as more of a "relational query builder" than an ORM. Like Bookshelf.js, it is built on top of the powerful Knex.js query builder library, and so builds ORM-like features on top of a flexible query builder that you can always drop down to. [Objection to ORM Hatred](https://www.jakso.me/blog/objection-to-orm-hatred), written by the creator of the Objection.js library, concisely summarizes its design goals and where it fits in the raw SQL-to-ORM spectrum. Objection.js seems to be more actively maintained and better documented than Bookshelf.js, and many Objection.js developers formerly worked with Bookshelf.js according to [Who uses objection.js in production?](https://github.com/Vincit/objection.js/issues/1069)

### Type Definitions: Built-in

Objection.js provides [built-in TypeScript support](https://github.com/Vincit/objection.js/blob/master/typings/objection/index.d.ts). Like Bookshelf.js, Objection.js began as a JavaScript library and typings were added later as TypeScript grew in popularity and adoption. However, unlike Bookshelf.js, Objection.js provides thorough type safety when working with models and queries. 

### Record Creation: Type safe

Models are defined in Objection.js by extending the `Model` class. Within a, say, `User` model, the developer defines non-nullable and optional properties like `name!` and `age?`, and provides a required `tableName` property.  The developer can also provide an optional [JSON Schema](http://json-schema.org/) for Model validation. Relations to other models like `HasMany`  are also defined in the model class.

When creating new records, the `User.query().insert()` method is type-safe. Model properties are autocompleted and attempting to add properties not defined in the model class will result in compiler errors. 

When creating new records for relations, like a new `Post` for a `User`, the developer uses the `user.$relatedQuery('posts').insert()` call. This is also type safe and although you can replace `posts` with a non-existent model or relation, the chained `insert`  call will then spit out compiler errors. Model properties are autocompleted within the `insert()` command and including undefined `Post` properties will result in a compiler error.

Nested writes can also be done using the `insertGraph()` operation:

```javascript
 const user = await User.query().insertGraph({
    firstName: 'Sylvester',
    lastName: 'Stallone',
    posts: [
      {
        title: 'My first post',
      }
    ]
  });
```

This operation is also type-safe and model properties are autocompleted for the nested model.

### Record Fetching: Partially type safe

When fetching records from the database, queries and return objects are typed. When fetching relations using `relatedQuery`, the return type of the relation is also correctly inferred. In the following example, the return type of posts is `Post[]`:

```javascript
const posts = await User.relatedQuery('posts')
  .for(1)
  .orderBy('title');
console.log(posts[0].name)
```

If instead of `'posts'` you enter a model or relation that doesn't exist, the compiler won't emit any errors until you attempt to access a model property. At this point the compiler will spit out a `Property does not exist` error.

Using eager loading and the `withGraphFetched()` method, where relation data loaded at the same time, the above snippet would look like this:

```javascript
const userWithPosts = await User.query().findById(1).withGraphFetched('posts');
console.log(userWithPosts.posts![0].title);
```

In this case the type of `userWithPosts` is inferred as `User`. The compiler emits an `Object is possibly undefined` error when attempting to access the post's `title` property unless a non-null assertion is included.

If instead of `'posts'` you enter a model or relation that doesn't exist, the compiler won't emit any errors. For example the following code would be valid according to the compiler:

```javascript
const userWithPosts = await User.query().findById(1).withGraphFetched('postssss');
```

### Type Safety: Strong

Along with MikroORM and Bookshelf.js, Objection.js is an ORM-like library built around the Knex.js query builder. Its TypeScript support and type safety are much stronger than Bookshelf.js and comparable to MikroORM’s. It is a strong choice for developers seeking a pared-down, minimal ORM-like library with strong TypeScript typings.

## MikroORM

### Evaluation summary

* **Type definitions**: Built-in
* **Record creation**: Type-safe
* **Record fetching**: Type-safe

### Overview

* [Website](https://mikro-orm.io/)
* [GitHub](https://github.com/mikro-orm/mikro-orm)
* [npm](https://www.npmjs.com/package/mikro-orm)

MikroORM is a newer TypeScript ORM that also [supports vanilla JavaScript](https://mikro-orm.io/docs/usage-with-js/). It is a fast growing project that is very active on GitHub and is strongly supported by its developers. Influenced by Doctrine (a PHP ORM), it is a Data Mapper, Identity Map, and Unit of Work influenced ORM. Some of its features include automatic transaction handling, support for multiple databases, a built-in Knex.js-based Query Builder, and Schema and Entity generators.

### Type Definitions: Built-in

As a TypeScript-first ORM, MikroORM builds in its own extensive set of type definitions.

### Record Creation: Type safe

Defining models with MikroORM involves extending a `BaseEntity` class where the model's properties are declared, typed, and decorated with `@Property` and relation decorators. With these classes defined, records can be created in a type-safe manner by creating instances of these model classes. Model fields are type-checked and autocompleted. Models linked by a relation can be persisted at the same time in a transaction using `persistAndFlush()`. For example:

```javascript
const user = new User('Dave Johnson', 'dave@johns.on');
user.age = 14
const post1 = new Post("Dave's First Post", user);
const post2 = new Post("Dave's Second Post", user);

// Persist the post, author will be automatically cascade persisted
await DI.em.persistAndFlush([post1, post2]);
```

Here the `Post` model requires a `title` and  `User` in its constructor, and record creation will fail if these are not provided. You can access the post's author object using its properties, e.g. `post1.author.title`.

### Record Fetching: Type-safe

MikroORM also provides strong type safety when fetching records from the database. Records can be fetched using EntityRepositories or an EntityManager. 

When fetching records using a repository for a given model, say a `userRepository`, the return object is typed and you cannot query based on properties that haven't been defined in the model. Furthermore, including relations will result in the object's type reflecting which relations were loaded. For example, with a `User` model linked to `Post` and `Item` models, the following command:

```javascript
const UserWithPosts = await DI.userRepository.findOne(1, ['posts']);
```

Results in this type:

```javascript
const UserWithPosts: (User & {
    posts: LoadedCollection<Post, Post>;
    items: Collection<Item, unknown>;
}) | null
```

Here we see that posts were loaded and items were not. One limitation is that in the `findOne` relation array, additional strings corresponding to non-existent relations can be appended (like appending ‘postsss’ to the array) without any error output from the compiler. Furthermore, relations can be accessed even though they weren't explicitly populated without any error from the compiler.

A similar level of type-safety applies when using `EntityManager`'s `find()` or `findOne()` functions, like in the following example:

```javascript
const userWithPosts = await DI.em.findOne(User, {email: 'dave@johns.on'}, ['posts'])
```

The type is again inferred as:

```javascript
const user: (User & {
    posts: LoadedCollection<Post, Post>;
    items: Collection<Item, unknown>;
}) | null
```

### Type Safety: Strong

MikroORM is a powerful ORM that also packs in the flexible Knex.js query builder. Knex.js results can be mapped to Models using `EntityManager.map()`, a unique and powerful feature. It provides strong type safety when working with models and query results.

## Waterline

### Evaluation summary

* **Type definitions**: @types
* **Record creation**: Not Type-safe
* **Record fetching**: Not Type-safe

### Overview

* [Website](https://sailsjs.com/documentation/reference/waterline-orm)
* [GitHub](https://github.com/balderdashy/waterline)
* [npm: Waterline](https://www.npmjs.com/package/waterline)

Waterline is the default ORM used in the Sails Node.js framework. Part of its design is to allow you to use "write once, use anywhere" data manipulation code, so that you can write code to query or manipulate your data whether it lives in a MySQL, PostgreSQL, MongoDB, or other database.

### Type Definitions: [@types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/30813acabce6fce9fcd6871421784a9113662fe3/types/bookshelf/index.d.ts)

Type definitions for Waterline can be found in the [Definitely Typed](https://github.com/DefinitelyTyped/DefinitelyTyped) repository of TypeScript type definitions. They are not built-in to the library.

### Record Creation: Not type-safe

With Waterline, models are defined using `Waterline.Collection.extend()`. The table name is specified and attributes for the model like `id` and `name` are declared along with their type. Models are then added to the Waterline instance which is used to create records. Record creation in Waterline is not type-safe and you can set attributes in new records that weren't defined in the model. Furthermore, the return type is `any`, which is frequently passed around when using Waterline.

### Record Fetching: Not type-safe

When fetching records from the database using the Waterline instance and the given model, any attributes, even non-existent ones, can be inserted into the `find()` method without triggering any compiler errors. The method's return type is `any`. Querying data using Waterline and the `@types` typings is generally not type-safe.

### Type Safety: Weak

Waterline's models are not type-safe and data manipulation and creation operations are similarly not type-safe. Waterline is primarily a JavaScript library and its typings provide the bare minimum for TypeScript code to compile. 

## Typegoose and Mongoose

### Evaluation summary

* **Type definitions**: @types
* **Record creation**: Type-safe
* **Record fetching**: Not Type-safe

### Overview

* [Website](https://typegoose.github.io/typegoose/)
* [GitHub](https://github.com/typegoose/typegoose)
* [npm: Typegoose](https://www.npmjs.com/package/typegoose)

Mongoose is a popular and well maintained Node.js data modeling tool for MongoDB. It allows you to model your data using schemas and it includes built-in type casting, validation, query building, and business logic hooks. If you're using a MongoDB database with Node.js and want to use an ORM-like tool to map objects to database documents (or ODM), Mongoose is a safe bet: it is a popular, mature project that continues to be actively maintained. 

There are two main ways to use strong TypeScript typing with Mongoose. One way is to use types from the `@types` repository and write custom interfaces for your models. The other is to use [Typegoose](https://github.com/typegoose/typegoose) along with typings from `@types`. Typegoose allows you to define Mongoose models using classes. In this article we'll consider Typegoose.

### Type Definitions: [@types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/mongoose)

To use Typegoose you first have to install Mongoose and its `@types` type definitions. These can be found in the [Definitely Typed](https://github.com/DefinitelyTyped/DefinitelyTyped) repository. They are not built-in to the library.

### Record Creation: Type-safe

To create models with Typegoose, you define model classes, like `User`, and their properties, like `name` and `age`. Properties are decorated with the `@prop()` decorator to specify additional information like whether or not the properties are required and how they are related to other models. 

Once the models have been defined, records can be created in a type-safe manner using Mongoose `Model` objects. Model properties are autocompleted and attempting to add undefined properties results in a compiler error. The return object type corresponds to the defined Model class (`DocumentType<User>`) and its properties can be accessed in a type-safe manner. This type safety also extends to nested models (for example saving a `User` with nested `Post` objects).

### Record Fetching: Not type-safe

When querying records from the database using `Model.find()`, filter properties are not type checked and it is possible to append properties that haven't been defined without any compiler error. This will result in Mongoose attempting to cast the filter. If this fails, a `CastError` will be thrown at runtime. 

When using `.populate()` on a model to populate references to other documents, anything can be entered into the `.populate()` method without compiler error, so this operation similarly is not type-safe. 

The return type from a `find()` or `findOne()` command is correctly typed according to the model used to query the database.

### Type Safety: Moderate

Typegoose leverages Classes and Decorators to help you build Mongoose models quickly. When creating records, parameters are type checked, but when querying it is up to the developer to build in additional safeguards. It is a great place to get started with type-safe TypeScript and MongoDB.

## Briefly Considered

This article focuses on the type safety of the most popular ORMs referenced in [Top 11 Node.js ORMs, Query Builders & Database Libraries in 2020](https://www.prisma.io/dataguide/database-tools/top-nodejs-orms-query-builders-and-database-libraries-in-2020) from Prisma's [Data Guide](https://www.prisma.io/dataguide/). There are other libraries you may want to consider when working with TypeScript, Node.js, and databases. 

### Knex.js

* [GitHub](https://github.com/knex/knex)
* [Website](http://knexjs.org/)
* [npm](https://www.npmjs.com/package/knex)

Knex.js is a Node.js query builder (not ORM) that supports multiple databases and includes features like transaction support, connection pooling, and a streaming interface. It allows you to work at a level above the database driver and avoid writing SQL by hand. However, as it is a lower level library, familiarity with SQL and relational database concepts like joins and indices is expected. Official TypeScript bindings are built-in to the `knex` NPM package. TypeScript support is best-effort and "not all usage patterns can be type-checked." The knex documentation also states that "lack of type errors doesn't currently guarantee that the generated queries will be correct."

### PgTyped

* [GitHub](https://github.com/adelsz/pgtyped)
* [Website](https://pgtyped.now.sh/)

PgTyped's goal is to allow you to write raw SQL and also guarantee the type-safety of the queries you write. It automatically generates TypeScript typings for the parameters and results of SQL queries by processing a SQL file and connecting directly to a running PostgreSQL database. It currently only supports PostgreSQL. 

### @slonik/typegen

* [GitHub](https://github.com/mmkal/slonik-tools/tree/master/packages/typegen#sloniktypegen)
* [npm](https://www.npmjs.com/package/@slonik/typegen)

A similar package to PgTyped is the Slonik typegen library that uses the [Slonik PostgreSQL client](https://github.com/gajus/slonik) to generate TypeScript interfaces from raw SQL queries. To use the typegen library, you import it and use a proxy object that it generates to run queries. After running a query, typegen will inspect the the field types of the query result and generate a TypeScript interface for that query. Subsequent queries can then be executed in a type-safe manner.

## Conclusion

This article briefly assesses the type safety of the most popular Node.js ORMs, database toolkits, and query builders. It draws its list of libraries from [Top 11 Node.js ORMs, Query Builders & Database Libraries in 2020](https://www.prisma.io/dataguide/database-tools/top-nodejs-orms-query-builders-and-database-libraries-in-2020), where the health of these libraries is evaluated according to criteria like repository activity and developer support.

Type safety is not the only criteria you should use when choosing a tool to interact with your database. It is also important to consider the package’s programming interface, design, support for your database’s features, and flexibility. Different Node.js projects may require different tools.

To learn more about query builders and ORMs, please consult [Comparing SQL, Query Builders, and ORMs](https://dataguide.prisma.io/types/relational/comparing-sql-query-builders-and-orms) from [Prisma’s Data Guide](https://dataguide.prisma.io/), a free helpful knowledge base for learning about databases, data modeling, and much more.
