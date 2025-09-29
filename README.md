# Proxy Interno Resiliente para API com Rate Limiting

## 1. Visão Geral

Este projeto implementa um serviço de proxy interno resiliente, projetado para consumir uma API externa que impõe um limite de 1 requisição por segundo. O objetivo principal é gerenciar o fluxo de múltiplas requisições internas, evitando penalidades por exceder o rate limit e, ao mesmo tempo, otimizando a latência e a disponibilidade do serviço.

A solução acomoda picos de requisições, garante uma cadência estável de chamadas à API externa e monitora seu próprio estado de saúde e desempenho.

## 2. Funcionalidades Implementadas

-   **[Obrigatório] Fila de Requisições (Backpressure):** Utiliza uma fila interna para enfileirar requisições que chegam em rajadas, evitando a sobrecarga do serviço externo.
-   **[Obrigatório] Rate Limiter (Scheduler):** Um agendador processa a fila na cadência exata de **1 requisição por segundo**, respeitando o limite imposto pela API.
-   **[Obrigatório] Cache:** Resultados de requisições são armazenados em cache para fornecer respostas instantâneas a chamadas repetidas, reduzindo a latência e o consumo da cota de requisições.
-   **Observabilidade Básica:** Expõe métricas de desempenho e saúde através dos endpoints `/metrics` e `/health`.

## 3. Setup e Execução

### Pré-requisitos
- Node.js
- npm

### Passos para Execução

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/rafsasas/Proxy-TADS.git
    cd proxy-tads
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente**
    Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
    ```
    # URL da API externa que será "proxyada"
    UPSTREAM_URL=https://score.hsborges.dev
    
    # Porta em que o servidor proxy irá rodar
    PORT=3000
    
    # Credencial de acesso para a API externa
    CLIENT_ID=12 (exemplo)
    ```

4.  **Inicie o Servidor**
    ```bash
    npm start
    ```
    O servidor estará disponível em `http://localhost:3000`.

### Executando os Testes Automatizados

O projeto inclui uma suíte de testes automatizados para validar os cenários de rajada de requisições e o funcionamento do cache. Para executá-la, use o comando:
```bash
npm test
```

## 4. Endpoints e Exemplos de Uso

### `GET /health`
Verifica a saúde do serviço.
```bash
curl -i http://localhost:3000/health

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 15
{"status":"UP"}
```

### `GET /metrics`
Retorna métricas de operação do proxy.
```bash
curl http://localhost:3000/metrics
```
**Exemplo de Resposta:**
```json
{
  "totalRequests": 4,
  "cacheHits": 2,
  "queueSize": 0,
  "cacheHitRate": 0.5
}
```

### `GET /proxy/score`
Endpoint principal que atua como proxy. Quaisquer parâmetros de query string são repassados à API externa.
```bash
curl "http://localhost:3000/proxy/score?cpf=44087674096"
```
**Exemplo de Resposta (sucesso):**
```json
StatusCode        : 200
StatusDescription : OK
Content           : {"success":true,"data":{"cpf":"440.876.740-96","score":352,"message":"O score de 440.876.740-96 é 352"}}
```
**Exemplo de Resposta (cache):**
```json
{
  "success": true,
  "data": {
    "cpf": "440.876.740-96",
    "score": 352,
    "message": "O score de 440.876.740-96 é 352"
  },
  "cached": true
}
```

## 5. Relatório Técnico

### 5.1. Arquitetura e Decisões de Design

#### Padrões de Projeto Adotados

-   **Singleton**: Escolhido para garantir que o `HttpClient` e a `Fila` tenham uma única instância global. Esta decisão foi crucial para centralizar o controle do estado da aplicação, como o tamanho da fila e as métricas, e para garantir que o agendador de requisições opere de forma unificada.
-   **Command**: Utilizado para encapsular cada requisição à API externa como um objeto. Isso desacoplou a lógica de execução da lógica de enfileiramento, facilitando o gerenciamento das requisições como unidades de trabalho. Além disso, o padrão simplificou a criação de chaves para o sistema de cache.

#### Padrões de Projeto Rejeitados

-   **Fila em Serviço Externo (ex: RabbitMQ, Redis):** Foi considerada a utilização de uma solução de mensageria externa para a fila. Embora essa abordagem seja mais escalável e resiliente a reinicializações do serviço, ela foi **rejeitada** para manter a simplicidade arquitetônica e evitar dependências externas, focando em uma solução autocontida, conforme o escopo do desafio.

### 5.2. Experimentos e Resultados dos Testes

A suíte de testes (`npm test`) valida os requisitos não funcionais obrigatórios:

1.  **Rajada Controlada:** O teste de rajada envia múltiplas requisições simultâneas ao proxy. Os resultados confirmam que todas são enfileiradas e o *mock* da API externa é chamado na cadência de 1 vez por segundo. Isso valida a eficácia da fila e do *scheduler* em proteger o serviço externo.
2.  **Funcionamento do Cache:** Os testes confirmam que, após uma primeira requisição bem-sucedida, uma segunda requisição idêntica é respondida a partir do cache, sem acionar uma nova chamada à API externa.

### 5.3. Análise Crítica e Trade-offs

-   **Simplicidade vs. Escalabilidade:** A solução atual, com uma fila em memória, é extremamente simples de operar e ideal para um ambiente de *single instance*. No entanto, este design não escala horizontalmente. Em um ambiente com múltiplos contêineres, cada instância teria sua própria fila e *rate limiter*, o que violaria o limite global de 1 req/s. Para escalar, seria necessário migrar a fila para um serviço centralizado.
-   **Persistência de Dados:** As requisições na fila são voláteis. Se a aplicação for reiniciada, as requisições pendentes são perdidas. Para casos de uso onde as requisições são críticas, uma fila persistente seria uma melhoria necessária.
-   **Resiliência a Falhas:** O projeto não implementa o padrão Circuit Breaker. Isso significa que, se a API externa ficar lenta ou instável, o proxy continuará tentando enviar requisições, podendo esgotar seus próprios recursos e aumentar o tempo de espera na fila. A implementação de um Circuit Breaker é um próximo passo crucial para tornar o serviço mais robusto.
-   **Configuração:** Parâmetros como o tamanho da fila e o tempo de vida (TTL) do cache estão definidos diretamente no código. Uma evolução do projeto externalizaria todas essas configurações para torná-lo mais flexível e adaptável a diferentes cenários de carga sem a necessidade de re-deploy.
