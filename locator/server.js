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
    
    // Tratamento para IP local ou Loopback (Rede Interna)
    const isPrivateIp = 
      clientIp === '::1' || 
      clientIp === '127.0.0.1' || 
      clientIp.startsWith('192.168.') || 
      clientIp.startsWith('10.') || 
      !clientIp;

    if (isPrivateIp) {
      clientIp = '177.1.222.220'; // IP fallback para testes locais (Campo Grande - MS)
    }

    // Consulta geolocalização por IP com campos específicos
    const response = await axios.get(
      `http://ip-api.com/json/${clientIp}?fields=status,message,country,region,regionName,city,zip,timezone&lang=pt-BR`, 
      { timeout: 5000 }
    );

    if (response.data.status === 'fail') {
      return res.status(400).json({ erro: 'Não foi possível localizar este IP', detalhe: response.data.message });
    }

    // Fuso horário retornado pelo IP (Fallback para America/Campo_Grande se ausente)
    const timeZoneOuvinte = response.data.timezone || 'America/Campo_Grande';

    // Gerar horário local formatado conforme o fuso do ouvinte
    const agora = new Date();
    const horarioFormatado = agora.toLocaleTimeString('pt-BR', { 
      timeZone: timeZoneOuvinte,
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    const dadosLocalizacao = {
      bairro: response.data.zip ? `Região CEP ${response.data.zip}` : 'Centro / Região Geral',
      cidade: response.data.city || 'Campo Grande',
      estado: response.data.regionName || 'Mato Grosso do Sul',
      uf: response.data.region || 'MS',
      pais: response.data.country || 'Brasil',
      fusoHorario: timeZoneOuvinte,
      horario: horarioFormatado
    };

    console.log(`[OUVINTE CONECTADO] ${dadosLocalizacao.cidade}/${dadosLocalizacao.uf} às ${dadosLocalizacao.horario} (${timeZoneOuvinte})`);

    return res.json(dadosLocalizacao);
  } catch (error) {
    console.error('[ERRO NA API]:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao consultar localização' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Power Dance rodando na porta ${PORT}`));