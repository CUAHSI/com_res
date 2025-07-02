# com_res!

## Getting Started

### Clone the repo, checkout this branch
```console
git clone https://github.com/CUAHSI/com_res.git
cd com_res
git checkout develop
```

### Full stack for local development
```console
cp .env.template .env
make build-all
make up-all
```
The API will be available at http://0.0.0.0:8000
The UI will be available at http://localhost:5173

To bring the stack down:
```console
make down-all
```
To see logs:
```console
make logs-front
#or
make logs-back
```
## Formatting and linting
```console
# backend:
make format
# frontend:
cd frontend && lint-format-fix
```
Formatting and linting is run with a git pre-commit hook using Husky.
It requires the Docker daemon to be running.
If you are having trouble with the formatting and linting, you can see here how to skip the git hook:
https://typicode.github.io/husky/how-to.html#skipping-git-hooks
However note that this is not recommended -- let's keep our code clean!