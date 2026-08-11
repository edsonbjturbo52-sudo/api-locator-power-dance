const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Permite requisições de qualquer origem (seu player web)
app.use(cors());

// Rota principal de geolocalização do ouvinte
app.get('/api/localizacao', async (req, res) => {
  try {
    // Captura o IP real considerando Cloudflare, proxies do Render e conexões diretas
    let clientIp = 
      req.headers['cf-connecting-ip'] || 
      req.headers['x-forwarded-for'] || 
      req.socket.remoteAddress || 
      '';

    // Se houver múltiplos IPs na cadeia (proxy), pega o primeiro (IP do cliente)
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Limpa o prefixo IPv6 em ambientes híbridos (ex: ::ffff:189.10.20.30 -> 189.10.20.30)
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.replace('::ffff:', '');
    }

    // Se estiver testando localmente (localhost), usa um IP público para simular
    if (clientIp === '::1' || clientIp === '127.0.0.1' || !clientIp) {
      clientIp = '8.8.8.8';
    }

    // Consulta a API de geolocalização com limite de tempo de 5 segundos
    const response = await axios.get(`http://ip-api.com/json/${clientIp}?lang=pt-BR`, {
      timeout: 5000
    });

    if (response.data.status === 'fail') {
      console.warn(`[AVISO] Falha ao localizar o IP: ${clientIp}`);
      return res.status(400).json({ erro: 'Não foi possível localizar este IP' });
    }

    const dadosLocalizacao = {
      cidade: response.data.city || 'Desconhecida',
      estado: response.data.regionName || 'Desconhecido',
      uf: response.data.region || '',
      pais: response.data.country || 'Brasil',
      ip: clientIp
    };

    // REGISTRA NO PAINEL DE LOGS DO RENDER TODA VEZ QUE ALGUÉM ACESSA
    console.log(`[OUVINTE CONECTADO] ${dadosLocalizacao.cidade}/${dadosLocalizacao.uf} | IP: ${clientIp}`);

    res.json(dadosLocalizacao);
  } catch (error) {
    console.error('[ERRO NA API]:', error.message);
    res.status(500).json({ erro: 'Erro interno ao consultar localização' });
  }
});

// Rota inicial de verificação de status (Health Check)
app.get('/', (req, res) => {
  res.send('API Rádio Power Dance ativa e operacional! 🎧🔥');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Power Dance rodando na porta ${PORT}`));