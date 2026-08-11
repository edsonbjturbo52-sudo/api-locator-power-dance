const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/localizacao', async (req, res) => {
  try {
    let clientIp = 
      req.headers['cf-connecting-ip'] || 
      req.headers['x-forwarded-for'] || 
      req.socket.remoteAddress || 
      '';

    if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
    if (clientIp.startsWith('::ffff:')) clientIp = clientIp.replace('::ffff:', '');
    if (clientIp === '::1' || clientIp === '127.0.0.1' || !clientIp) {
      clientIp = '177.1.222.220'; // IP de testes (Campo Grande)
    }

    // Consulta geolocalização por IP
    const response = await axios.get(`http://ip-api.com/json/${clientIp}?lang=pt-BR`, { timeout: 5000 });

    if (response.data.status === 'fail') {
      return res.status(400).json({ erro: 'Não foi possível localizar este IP' });
    }

    // Gerar horário local formatado (Horário de Brasília / Região)
    const agora = new Date();
    const horarioFormatado = agora.toLocaleTimeString('pt-BR', { 
      timeZone: 'America/Campo_Grande', // Ajuste a fuso se necessário
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    // Monta o JSON completo solicitado
    const dadosLocalizacao = {
      bairro: response.data.zip ? `Região CEP ${response.data.zip}` : 'Centro / Região Geral',
      cidade: response.data.city || 'Campo Grande',
      estado: response.data.regionName || 'Mato Grosso do Sul',
      uf: response.data.region || 'MS',
      pais: response.data.country || 'Brasil',
      horario: horarioFormatado
    };

    console.log(`[OUVINTE CONECTADO] ${dadosLocalizacao.cidade}/${dadosLocalizacao.uf} às ${dadosLocalizacao.horario}`);

    res.json(dadosLocalizacao);
  } catch (error) {
    console.error('[ERRO NA API]:', error.message);
    res.status(500).json({ erro: 'Erro interno ao consultar localização' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Power Dance rodando na porta ${PORT}`));