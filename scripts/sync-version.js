#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read package.json version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Read Cargo.toml
const cargoTomlPath = 'src-tauri/Cargo.toml';
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');

// Update version in Cargo.toml
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${version}"`);

// Write back to Cargo.toml
fs.writeFileSync(cargoTomlPath, cargoToml);

console.log(`✅ Synced version to ${version} in Cargo.toml`); 