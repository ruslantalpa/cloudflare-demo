## What is this!

This is project that exposes a PostgREST like interface to an underlying SQLite database from a Cloudflare worker.

## Run it

init node modules
```
npm install
```

bring up the underlying subzero service
```
docker-compose up -d
```

start the worker
```
npx wrangler dev --local
```

open in browser [http://localhost:8787](http://localhost:8787)

## How is it different?

On the first look, appart from running on top of SQLite, the setup is very similar to the one described in [Build data-driven applications with Workers and PostgreSQL](https://developers.cloudflare.com/workers/tutorials/postgres/). The worker code mostly proxies request to the underlying subzero service running from docker alongside the worker, however there are quite a few architectural differences in subzero (when compared to tools like PostgREST/Hasura) that will potentially allow exposing PostgREST like capabilities in the form of a library (compiled to wasm) that can be leveraged directly insede the worker without the need for a "sidecar" service.

### subzero internals
subzero is a rust codebase that was designed from the start as a library with a thin wrapper on top to package it as a webserver. Internaly there are concepts as frontend (the type of API exposed, currently REST, GraphQL possible) and backend (different types of databases, currently PostgreSQL and SQLite).
Aditionally it supports a more finegraned configuration as to the exposed schema and security rules, plus capabilities to run [analitical queries](https://docs.subzero.cloud/reference/data/aggregate/) (aggregate/window functions, group by, ...)

### the exploration
The initial idea in relation to Clowdflare workers was to write a sqlite VFS plugin on top of Durable Objects however this direction raised a lot of obsticles like having the workers use a lot more memory since they would need to package the sqlite dependency internally and also the code would not be running "close" the underlying database (Durable Objects).

The next direction was to explore having subzero running as a side service (the current setup). The main advantage is that the code running in the workers remains small and subzero could maintain long lived connections to the databases. Ofcourse that does not mean having a separate instance of subzero running for each underlying database since subzero can serve multiple clients from a single instance based on the "Hosts" header (not demonstrated here).

While the second approach has it's advatages compared to the first one, it's still a chore to manage a distributed network of subzero instances, however this became unecessary yesterday when **D1** was introduced.
When the rust bindings become available, it means it's possible to support **D1** as an aditional backend and it would be relatively trivial since the bulk of the work was already done for the SQLite.

This means subzero lib can be compiled to wasm and included as a dependency in workers, allowing them to easely expose "auto generated" apis on top of **D1**. The developer experience is also a lot better compared to running a side service (like postgrest) since for custom functionality one would have to resort to creating database side code (views/functions) while in this case, specific routes can be handled by separate code executing raw sql and that is in adition to being able to easely add custom logic before/after the request reaches the database.



