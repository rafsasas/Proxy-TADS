

## Como usar

1. Instalar dependências:
```bash
npm install
```

2. Configurar .env:
```
UPSTREAM_URL=https://score.hsborges.dev
PORT=3000
```

3. Rodar:
```bash
npm start
```

## Endpoints

- `GET /proxy/score` - Busca score da API

## Padrões implementados

- **Command**: Encapsula requisições
- **Singleton**: Instância única do cliente HTTP e fila

## Funcionalidades

- Cache automático
- Fila de requisições
- Rate limiting (1 req/segundo)