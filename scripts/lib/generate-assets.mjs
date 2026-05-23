import fs from 'node:fs/promises';
import path from 'node:path';

const OPENAI_IMAGE_OUTPUT_FORMAT = 'webp';

export async function generateArticleImage({ prompt, outFile, fallbackTitle }) {
  assertWebpOutputPath(outFile);
  if (!process.env.OPENAI_API_KEY) {
    await writeFallbackSvg(outFile.replace(/\.webp$/, '.svg'), fallbackTitle);
    return outFile.replace(/\.webp$/, '.svg');
  }
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
      output_format: OPENAI_IMAGE_OUTPUT_FORMAT,
      output_compression: Number(process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION || 82)
    })
  });
  const json = await response.json();
  if (!response.ok) {
    console.warn(`OpenAI image warning: ${JSON.stringify(json)} — falling back to SVG`);
    const svgFile = outFile.replace(/\.webp$/, '.svg');
    await writeFallbackSvg(svgFile, fallbackTitle);
    return svgFile;
  }
  if (json.data?.[0]?.output_format && json.data[0].output_format !== OPENAI_IMAGE_OUTPUT_FORMAT) {
    throw new Error(`OpenAI image response format was ${json.data[0].output_format}, expected ${OPENAI_IMAGE_OUTPUT_FORMAT}`);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI image response did not include b64_json');
  const image = Buffer.from(b64, 'base64');
  if (!isWebp(image)) throw new Error('OpenAI image response was not WebP data');
  await fs.writeFile(outFile, image);
  return outFile;
}

function assertWebpOutputPath(outFile) {
  if (path.extname(outFile).toLowerCase() !== '.webp') {
    throw new Error(`Article images must be written as .webp files: ${outFile}`);
  }
}

function isWebp(buffer) {
  return buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
}

async function writeFallbackSvg(outFile, title) {
  const safe = String(title).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#fff1f6"/><circle cx="930" cy="150" r="110" fill="#69c9b8" opacity=".32"/><path d="M130 500 C260 390 410 560 560 430 C705 305 820 380 1010 290" fill="none" stroke="#ec5c93" stroke-width="34" stroke-linecap="round"/><text x="90" y="210" font-family="'Yu Gothic', sans-serif" font-size="54" font-weight="800" fill="#231923">${safe}</text><text x="92" y="590" font-family="'Yu Gothic', sans-serif" font-size="34" font-weight="800" fill="#ec5c93">美スリム研究所</text></svg>`;
  await fs.writeFile(outFile, svg);
}
