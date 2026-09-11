export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const configuredPin = process.env.ACCESS_PIN;
  if (configuredPin && String(req.headers['x-access-pin'] || '') !== configuredPin) {
    return res.status(401).json({ error: 'Código de acesso inválido.' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini ainda não configurado.' });
  const { text = '', title = '', style = 'topicos', audience = '' } = req.body || {};
  if (!String(text).trim()) return res.status(400).json({ error: 'Informe o que aconteceu na oficina.' });
  const format = style === 'descritivo' ? '1 a 3 parágrafos institucionais' : '3 a 6 tópicos iniciados por •';
  const prompt = `Reescreva este relato de oficina do SCFV em português do Brasil, com linguagem institucional simples, em ${format}. Não invente fatos, materiais, resultados ou atividades. Quando couber, use a expressão cada usuário(a). Corrija apenas erros evidentes de termos de costura. Se o título estiver vazio, proponha um título curto. Responda somente em JSON válido com as chaves titulo e conteudo. Turma: ${audience}. Título atual: ${title}. Relato: ${text}`;
  const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data?.error?.message || 'Falha ao consultar a IA.' });
    const out = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let parsed;
    try { parsed = JSON.parse(out.replace(/^```json\s*/i,'').replace(/```$/,'').trim()); }
    catch { parsed = { titulo: title, conteudo: out.trim() }; }
    return res.status(200).json({ titulo: parsed.titulo || title, conteudo: parsed.conteudo || '' });
  } catch {
    return res.status(500).json({ error: 'Erro de conexão com a IA.' });
  }
}
