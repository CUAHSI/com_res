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