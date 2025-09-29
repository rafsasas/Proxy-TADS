require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas
const ProxyService = require('./ProxyService');
const { HttpClientSingleton, QueueSingleton } = require('../patterns/Singleton');

// Mock o módulo axios
jest.mock('axios');

// Mock o tempo do sistema para controlar os intervalos
jest.useFakeTimers();

describe('ProxyService', () => {
  let proxyService;
  let httpClient;
  let mockGet;

  beforeEach(() => {
    // Limpa todas as instâncias e timers antes de cada teste
    jest.clearAllMocks();
    ProxyService.instance = null;
    HttpClientSingleton.instance = null;
    QueueSingleton.instance = null;
    
    // Cria uma nova instância do serviço para cada teste
    proxyService = new ProxyService();
    httpClient = HttpClientSingleton.getInstance();
    // Cria um mock para o método 'get' do httpClient
    mockGet = jest.spyOn(httpClient, 'get').mockResolvedValue({ data: { score: 100 } });
  });

  // Teste para o cenário de "Rajada Controlada"
  test('deve enfileirar 20 requisições e processá-las a 1 req/s', async () => {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(proxyService.getScore({ user: `testuser${i}` }));
    }

    // Verifica se todas as 20 requisições foram enfileiradas
    expect(proxyService.getMetrics().queueSize).toBe(20);
    
    // Avança o tempo e os timers para processar todas as requisições
    for (let i = 0; i < 20; i++) {
        await jest.advanceTimersByTimeAsync(1000);
    }
    
    // Aguarda todas as promises serem resolvidas
    await Promise.all(promises);

    expect(mockGet).toHaveBeenCalledTimes(20);
    expect(proxyService.getMetrics().queueSize).toBe(0);
  });

  // Teste para o cache
  test('deve retornar dados do cache na segunda requisição para os mesmos parâmetros', async () => {
    // Primeira requisição
    const promise1 = proxyService.getScore({ user: 'cacheduser' });
    await jest.advanceTimersByTimeAsync(1000); // Processa a primeira requisição
    const result1 = await promise1;

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result1.cached).toBeUndefined();
    expect(result1.data.score).toBe(100);

    // Segunda requisição com os mesmos parâmetros
    const promise2 = proxyService.getScore({ user: 'cacheduser' });
    await jest.advanceTimersByTimeAsync(1000); // Processa a segunda requisição (deve vir do cache)
    const result2 = await promise2;
    
    // A chamada http.get não deve ser feita novamente
    expect(mockGet).toHaveBeenCalledTimes(1); 
    expect(proxyService.getMetrics().cacheHits).toBe(1);
    expect(result2.cached).toBe(true);
    expect(result2.data.score).toBe(100);
  });
});