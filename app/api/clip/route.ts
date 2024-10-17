// app/api/clip/route.ts
export default async function handler(req: any, res: any) {
  const { type, input } = req.body;

  try {
    let response;
    if (type === 'text') {
      response = await fetch('http://localhost:5000/embed-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
    } else if (type === 'image') {
      response = await fetch('http://localhost:5000/embed-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: input }),
      });
    }

    if (!response) {
      return res.status(400).json({ error: 'Invalid request type.' });
    }
    const embedding = await response.json();
    res.status(200).json({ embedding });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching embeddings.' });
  }
}
