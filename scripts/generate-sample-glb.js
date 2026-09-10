import * as THREE from 'three';
import fs from 'fs';
import path from 'path';

// Polyfill FileReader for Node.js environment
if (typeof globalThis.FileReader === 'undefined') {
  class PolyfillFileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
  }
  globalThis.FileReader = PolyfillFileReader;
}

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

function createSampleModel() {
  const root = new THREE.Group();
  root.name = 'Meshy_3D_Athlete_Model';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xF5D3BE,
    roughness: 0.45,
    metalness: 0.05,
    name: 'SkinMaterial'
  });

  const jerseyMat = new THREE.MeshStandardMaterial({
    color: 0xC70101, // MU Red
    roughness: 0.35,
    metalness: 0.1,
    name: 'JerseyMaterial'
  });

  const jerseyTrimMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.3,
    name: 'JerseyTrimMaterial'
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.5,
    name: 'BlackDetailMaterial'
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xF3AF19,
    roughness: 0.25,
    metalness: 0.8,
    name: 'GoldCrestMaterial'
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    color: 0xF8F9FA,
    roughness: 0.4,
    metalness: 0.05,
    name: 'ShortsMaterial'
  });

  // Torso / Jersey
  const torsoGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.72, 24);
  torsoGeo.scale(1.15, 1, 0.75);
  const torsoMesh = new THREE.Mesh(torsoGeo, jerseyMat);
  torsoMesh.position.y = 0.38;
  root.add(torsoMesh);

  // Jersey Collar
  const collarGeo = new THREE.TorusGeometry(0.16, 0.035, 16, 32);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, jerseyTrimMat);
  collarMesh.position.set(0, 0.73, 0);
  root.add(collarMesh);

  // Chest Crest (Gold MU Shield Badge)
  const crestGeo = new THREE.BoxGeometry(0.09, 0.11, 0.02);
  const crestMesh = new THREE.Mesh(crestGeo, goldMat);
  crestMesh.position.set(-0.13, 0.52, 0.2);
  root.add(crestMesh);

  // Sponsor bar
  const sponsorGeo = new THREE.BoxGeometry(0.28, 0.055, 0.015);
  const sponsorMesh = new THREE.Mesh(sponsorGeo, jerseyTrimMat);
  sponsorMesh.position.set(0, 0.38, 0.21);
  root.add(sponsorMesh);

  // Head & Neck
  const neckGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.14, 16);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.y = 0.78;
  root.add(neckMesh);

  const headGeo = new THREE.SphereGeometry(0.17, 24, 24);
  headGeo.scale(0.88, 1.1, 0.95);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.y = 0.98;
  root.add(headMesh);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.18, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
  hairGeo.scale(0.92, 1.12, 1.0);
  const hairMesh = new THREE.Mesh(hairGeo, blackMat);
  hairMesh.position.set(0, 1.01, -0.01);
  root.add(hairMesh);

  // Shoulders & Arms
  [-1, 1].forEach((side) => {
    // Shoulder sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.26, 16);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, jerseyMat);
    sleeveMesh.position.set(side * 0.38, 0.62, 0);
    sleeveMesh.rotation.z = side * -0.42;
    root.add(sleeveMesh);

    // Sleeve trim
    const sleeveTrimGeo = new THREE.TorusGeometry(0.1, 0.02, 12, 24);
    sleeveTrimGeo.rotateX(Math.PI / 2);
    const sleeveTrimMesh = new THREE.Mesh(sleeveTrimGeo, jerseyTrimMat);
    sleeveTrimMesh.position.set(side * 0.44, 0.51, 0);
    sleeveTrimMesh.rotation.z = side * -0.42;
    root.add(sleeveTrimMesh);

    // Forearm
    const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.32, 16);
    const armMesh = new THREE.Mesh(armGeo, skinMat);
    armMesh.position.set(side * 0.5, 0.34, 0.02);
    armMesh.rotation.z = side * -0.25;
    root.add(armMesh);

    // Hand
    const handGeo = new THREE.SphereGeometry(0.065, 16, 16);
    handGeo.scale(0.8, 1.2, 0.6);
    const handMesh = new THREE.Mesh(handGeo, skinMat);
    handMesh.position.set(side * 0.55, 0.14, 0.03);
    root.add(handMesh);
  });

  // Shorts / Hips
  const hipsGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.32, 24);
  hipsGeo.scale(1.1, 1, 0.8);
  const hipsMesh = new THREE.Mesh(hipsGeo, shortsMat);
  hipsMesh.position.y = -0.05;
  root.add(hipsMesh);

  // Legs & Boots
  [-1, 1].forEach((side) => {
    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.34, 16);
    const thighMesh = new THREE.Mesh(thighGeo, skinMat);
    thighMesh.position.set(side * 0.14, -0.32, 0);
    root.add(thighMesh);

    // Sock (Black & Red trim)
    const sockGeo = new THREE.CylinderGeometry(0.088, 0.072, 0.44, 16);
    const sockMesh = new THREE.Mesh(sockGeo, blackMat);
    sockMesh.position.set(side * 0.14, -0.66, 0);
    root.add(sockMesh);

    const sockTrimGeo = new THREE.TorusGeometry(0.088, 0.016, 12, 24);
    sockTrimGeo.rotateX(Math.PI / 2);
    const sockTrimMesh = new THREE.Mesh(sockTrimGeo, jerseyMat);
    sockTrimMesh.position.set(side * 0.14, -0.46, 0);
    root.add(sockTrimMesh);

    // Boot (White & Red accents)
    const bootGeo = new THREE.BoxGeometry(0.11, 0.1, 0.24);
    const bootMesh = new THREE.Mesh(bootGeo, jerseyTrimMat);
    bootMesh.position.set(side * 0.14, -0.92, 0.04);
    root.add(bootMesh);
  });

  return root;
}

const model = createSampleModel();
const exporter = new GLTFExporter();

try {
  const glb = await exporter.parseAsync(model, { binary: true });
  const buffer = Buffer.from(glb);
  const outPublic1 = path.join(process.cwd(), 'public', 'model.glb');
  const outPublic2 = path.join(process.cwd(), 'public', 'meshy_mu_athlete.glb');
  fs.writeFileSync(outPublic1, buffer);
  fs.writeFileSync(outPublic2, buffer);
  console.log('Successfully generated GLB models at:', outPublic1, 'and', outPublic2, 'Size:', buffer.length, 'bytes');
} catch (error) {
  console.error('Error exporting GLB:', error);
  process.exit(1);
}
