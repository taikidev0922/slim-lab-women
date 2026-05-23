import fs from 'node:fs/promises';
import path from 'node:path';

export async function generateArticleImage({ prompt, outFile, fallbackTitle }) {
  const svgFile = outFile.replace(/\.\w+$/, '.svg');
  const pngFile = outFile.replace(/\.\w+$/, '.png');

  if (!process.env.OPENAI_API_KEY) {
    await writeFallbackSvg(svgFile, fallbackTitle);
    return svgFile;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
        prompt,
        size: '1536x864',
        quality: 'medium',
        n: 1,
        response_format: 'b64_json'
      })
    });
    const json = await response.json();
    if (!response.ok) {
      console.warn(`OpenAI image warning: ${JSON.stringify(json)} — falling back to SVG`);
      await writeFallbackSvg(svgFile, fallbackTitle);
      return svgFile;
    }
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI image response did not include b64_json');
    await fs.writeFile(pngFile, Buffer.from(b64, 'base64'));
    return pngFile;
  } catch (err) {
    console.warn(`OpenAI image error: ${err.message} — falling back to SVG`);
    await writeFallbackSvg(svgFile, fallbackTitle);
    return svgFile;
  }
}

async function writeFallbackSvg(outFile, title) {
  const safe = String(title).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#fff1f6"/><circle cx="930" cy="150" r="110" fill="#69c9b8" opacity=".32"/><path d="M130 500 C260 390 410 560 560 430 C705 305 820 380 1010 290" fill="none" stroke="#ec5c93" stroke-width="34" stroke-linecap="round"/><text x="90" y="210" font-family="'Yu Gothic', sans-serif" font-size="54" font-weight="800" fill="#231923">${safe}</text><text x="92" y="590" font-family="'Yu Gothic', sans-serif" font-size="34" font-weight="800" fill="#ec5c93">美スリム研究所</text></svg>`;
  await fs.writeFile(outFile, svg);
}
