# com_res

## Getting Started

### Clone the repo, checkout this branch
```console
git clone https://github.com/CUAHSI/com_res.git
cd com_res
git checkout develop_v2
```

### API for local development
```console
cp .env.template .env
make build
make up
```
The API will be available at http://0.0.0.0:8000

### Frontend for local development
```console
cp .env.template .env  #if you haven't already
cd frontend
npm install
npm run dev
```
The frontend will be available at http://localhost:5173
More detailed info is available in the [frontend readme](frontend/README.md)

## Formatting
```console
make format
```
Formatting and linting is run with a git pre-commit hook using Husky.
It requires the Docker daemon to be running.
If you are having trouble with the formatting and linting, you can see here how to skip the git hook:
https://typicode.github.io/husky/how-to.html#skipping-git-hooks
However note that this is not recommended -- let's keep our code clean!