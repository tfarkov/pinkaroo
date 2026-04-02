import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';

const projectRoot = process.cwd();
const targetFiles = ['lib/mockData.ts', 'pages/index.tsx'];

async function loadDotEnv(filePath) {
  let raw = '';
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function extractUnsplashUrls(content) {
  const matches = content.match(/https:\/\/images\.unsplash\.com\/[^'"\s)]+/g) ?? [];
  return matches;
}

function buildPublicId(url) {
  const digest = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  return `pinkaroo/mock-assets/${digest}`;
}

async function main() {
  await loadDotEnv(path.join(projectRoot, '.env'));

  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary credentials: ${missing.join(', ')}`);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const fileContents = new Map();
  const allUrls = new Set();
  for (const relPath of targetFiles) {
    const absPath = path.join(projectRoot, relPath);
    const content = await fs.readFile(absPath, 'utf8');
    fileContents.set(relPath, content);
    for (const url of extractUnsplashUrls(content)) allUrls.add(url);
  }

  if (allUrls.size === 0) {
    console.log('No Unsplash URLs found. Nothing to upload.');
    return;
  }

  console.log(`Uploading ${allUrls.size} source image URLs to Cloudinary...`);
  const mapping = new Map();
  const failures = [];
  let fallbackUrl = '';
  let index = 0;
  for (const sourceUrl of allUrls) {
    index += 1;
    try {
      const publicId = buildPublicId(sourceUrl);
      const uploaded = await cloudinary.uploader.upload(sourceUrl, {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        type: 'upload',
      });
      mapping.set(sourceUrl, uploaded.secure_url);
      if (!fallbackUrl) fallbackUrl = uploaded.secure_url;
      console.log(`[${index}/${allUrls.size}] ${publicId}`);
    } catch (error) {
      failures.push(sourceUrl);
      if (fallbackUrl) {
        mapping.set(sourceUrl, fallbackUrl);
      }
      console.warn(`Failed to upload URL, using fallback: ${sourceUrl}`);
      console.warn(error?.message ?? error);
    }
  }

  for (const [relPath, original] of fileContents.entries()) {
    let updated = original;
    for (const [from, to] of mapping.entries()) {
      if (updated.includes(from)) {
        updated = updated.split(from).join(to);
      }
    }
    if (updated !== original) {
      await fs.writeFile(path.join(projectRoot, relPath), updated, 'utf8');
      console.log(`Updated ${relPath}`);
    }
  }

  if (failures.length > 0) {
    console.warn(`Completed with ${failures.length} fallback substitutions.`);
  }
  console.log('Done. Mock + hero image URLs now point to uploaded Cloudinary assets.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

