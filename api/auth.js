export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const configured = process.env.ACCESS_PIN;
  if (!configured) return res.status(200).json({ ok: true, pinRequired: false });
  const pin = String(req.body?.pin || '');
  if (pin !== configured) return res.status(401).json({ ok: false, message: 'Código incorreto.' });
  return res.status(200).json({ ok: true, pinRequired: true });
}
