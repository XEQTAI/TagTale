/**
 * Regenerate public/icon-192.png and public/icon-512.png from app/icon.svg
 * (PWA manifest + Apple touch). Run: node scripts/generate-icons.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'app', 'icon.svg')
const svg = fs.readFileSync(svgPath)

await sharp(svg).resize(192, 192).png().toFile(path.join(root, 'public', 'icon-192.png'))
await sharp(svg).resize(512, 512).png().toFile(path.join(root, 'public', 'icon-512.png'))

console.log('Wrote public/icon-192.png and public/icon-512.png from app/icon.svg')
