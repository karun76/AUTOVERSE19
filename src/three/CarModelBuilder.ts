import * as THREE from 'three';
import type { BodyArchetype } from '../data/cars';

export type WheelStyle = 'normal' | 'sport' | 'luxury';
export type FinishType = 'metallic' | 'matte';

export interface BuiltCarRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  wheelsGroup: THREE.Group;
  wheelRotators: THREE.Group[];
  paintMaterial: THREE.MeshPhysicalMaterial;
  rimMaterial: THREE.MeshStandardMaterial;
  caliperMaterial: THREE.MeshStandardMaterial;
  dispose: () => void;
}

interface ArchetypeDimensions {
  length: number;
  width: number;
  bodyHeight: number;
  cabinStart: number;
  cabinPeak: number;
  cabinEnd: number;
  cabinHeight: number;
  noseHeight: number;
  tailHeight: number;
  wheelRadius: number;
  wheelTrackZ: number;
  frontAxleX: number;
  rearAxleX: number;
  hasWing: boolean;
  wingHeight: number;
  groundClearance: number;
}

const ARCHETYPE_SPECS: Record<BodyArchetype, ArchetypeDimensions> = {
  hypercar: {
    length: 4.5,
    width: 1.98,
    bodyHeight: 0.48,
    cabinStart: -0.9,
    cabinPeak: 0.1,
    cabinEnd: 1.05,
    cabinHeight: 0.44,
    noseHeight: 0.24,
    tailHeight: 0.5,
    wheelRadius: 0.37,
    wheelTrackZ: 0.94,
    frontAxleX: 1.38,
    rearAxleX: -1.36,
    hasWing: true,
    wingHeight: 0.28,
    groundClearance: 0.12,
  },
  supercar: {
    length: 4.45,
    width: 1.94,
    bodyHeight: 0.5,
    cabinStart: -0.85,
    cabinPeak: 0.1,
    cabinEnd: 1.0,
    cabinHeight: 0.46,
    noseHeight: 0.26,
    tailHeight: 0.52,
    wheelRadius: 0.37,
    wheelTrackZ: 0.92,
    frontAxleX: 1.35,
    rearAxleX: -1.32,
    hasWing: true,
    wingHeight: 0.2,
    groundClearance: 0.14,
  },
  sports: {
    length: 4.4,
    width: 1.88,
    bodyHeight: 0.56,
    cabinStart: -0.95,
    cabinPeak: -0.05,
    cabinEnd: 0.9,
    cabinHeight: 0.5,
    noseHeight: 0.36,
    tailHeight: 0.58,
    wheelRadius: 0.37,
    wheelTrackZ: 0.89,
    frontAxleX: 1.34,
    rearAxleX: -1.3,
    hasWing: true,
    wingHeight: 0.14,
    groundClearance: 0.16,
  },
  coupe: {
    length: 4.5,
    width: 1.88,
    bodyHeight: 0.58,
    cabinStart: -1.05,
    cabinPeak: -0.1,
    cabinEnd: 0.85,
    cabinHeight: 0.5,
    noseHeight: 0.4,
    tailHeight: 0.58,
    wheelRadius: 0.37,
    wheelTrackZ: 0.89,
    frontAxleX: 1.38,
    rearAxleX: -1.32,
    hasWing: false,
    wingHeight: 0,
    groundClearance: 0.17,
  },
  muscle: {
    length: 4.65,
    width: 1.92,
    bodyHeight: 0.64,
    cabinStart: -1.1,
    cabinPeak: -0.15,
    cabinEnd: 0.78,
    cabinHeight: 0.5,
    noseHeight: 0.52,
    tailHeight: 0.64,
    wheelRadius: 0.39,
    wheelTrackZ: 0.91,
    frontAxleX: 1.42,
    rearAxleX: -1.36,
    hasWing: true,
    wingHeight: 0.1,
    groundClearance: 0.18,
  },
  sedan: {
    length: 4.75,
    width: 1.88,
    bodyHeight: 0.62,
    cabinStart: -1.25,
    cabinPeak: -0.1,
    cabinEnd: 0.95,
    cabinHeight: 0.54,
    noseHeight: 0.46,
    tailHeight: 0.62,
    wheelRadius: 0.38,
    wheelTrackZ: 0.89,
    frontAxleX: 1.44,
    rearAxleX: -1.4,
    hasWing: false,
    wingHeight: 0,
    groundClearance: 0.18,
  },
  suv: {
    length: 4.7,
    width: 1.96,
    bodyHeight: 0.78,
    cabinStart: -1.85,
    cabinPeak: -0.3,
    cabinEnd: 0.9,
    cabinHeight: 0.64,
    noseHeight: 0.68,
    tailHeight: 0.82,
    wheelRadius: 0.44,
    wheelTrackZ: 0.94,
    frontAxleX: 1.42,
    rearAxleX: -1.38,
    hasWing: false,
    wingHeight: 0,
    groundClearance: 0.28,
  },
};

export function createTurntableTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.5);
    bgGrad.addColorStop(0, '#1a202c');
    bgGrad.addColorStop(0.65, '#121721');
    bgGrad.addColorStop(1, '#0b0e14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle concentric showroom rings
    const rings = [160, 270, 380, 465, 492];
    rings.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle =
        idx === rings.length - 1
          ? 'rgba(214, 180, 93, 0.35)'
          : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = idx === rings.length - 1 ? 3 : 1.5;
      ctx.stroke();
    });

    // Subtle radial degree ticks on outer ring
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const inner = deg % 45 === 0 ? 446 : 456;
      const outer = 465;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
      ctx.lineTo(cx + Math.cos(rad) * outer, cy + Math.sin(rad) * outer);
      ctx.strokeStyle =
        deg % 45 === 0 ? 'rgba(214, 180, 93, 0.35)' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = deg % 45 === 0 ? 2 : 1;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildExtrudedBody(spec: ArchetypeDimensions): THREE.ExtrudeGeometry {
  const halfLen = spec.length / 2;
  const shape = new THREE.Shape();

  // Lower rocker/splitter baseline
  shape.moveTo(-halfLen + 0.08, 0.04);
  shape.lineTo(halfLen - 0.12, 0.02);
  // Front nose & bumper curve
  shape.quadraticCurveTo(halfLen + 0.06, 0.08, halfLen, spec.noseHeight);
  // Hood line
  shape.quadraticCurveTo(
    halfLen * 0.55,
    spec.noseHeight + 0.14,
    spec.cabinEnd,
    spec.bodyHeight,
  );
  // Windshield & cabin roof line
  shape.quadraticCurveTo(
    spec.cabinPeak + 0.35,
    spec.bodyHeight + spec.cabinHeight,
    spec.cabinPeak,
    spec.bodyHeight + spec.cabinHeight,
  );
  shape.quadraticCurveTo(
    spec.cabinStart + 0.35,
    spec.bodyHeight + spec.cabinHeight * 0.96,
    spec.cabinStart,
    spec.tailHeight,
  );
  // Rear deck & tail fascia
  shape.lineTo(-halfLen + 0.05, spec.tailHeight * 0.94);
  shape.quadraticCurveTo(-halfLen - 0.04, spec.tailHeight * 0.5, -halfLen + 0.08, 0.04);

  const extrudeWidth = spec.width - 0.16;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeWidth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 18,
  });

  // Center along Z
  geo.translate(0, 0, -extrudeWidth / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildCabinGlass(spec: ArchetypeDimensions): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const base = spec.bodyHeight * 0.86;
  shape.moveTo(spec.cabinStart + 0.16, base);
  shape.lineTo(spec.cabinEnd - 0.08, base);
  shape.quadraticCurveTo(
    spec.cabinPeak + 0.32,
    spec.bodyHeight + spec.cabinHeight - 0.04,
    spec.cabinPeak,
    spec.bodyHeight + spec.cabinHeight - 0.04,
  );
  shape.quadraticCurveTo(
    spec.cabinStart + 0.4,
    spec.bodyHeight + spec.cabinHeight * 0.9,
    spec.cabinStart + 0.16,
    base,
  );

  const glassWidth = spec.width - 0.24;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: glassWidth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 14,
  });
  geo.translate(0, 0, -glassWidth / 2);
  geo.computeVertexNormals();
  return geo;
}

function createWheelAssembly(
  radius: number,
  style: WheelStyle,
  tireMat: THREE.MeshStandardMaterial,
  rimMat: THREE.MeshStandardMaterial,
  discMat: THREE.MeshStandardMaterial,
  caliperMat: THREE.MeshStandardMaterial,
  isLeftSide: boolean,
): { assembly: THREE.Group; rotator: THREE.Group; disposables: THREE.BufferGeometry[] } {
  const assembly = new THREE.Group();
  const rotator = new THREE.Group();
  const disposables: THREE.BufferGeometry[] = [];

  const tireWidth = 0.28;
  const tireGeo = new THREE.CylinderGeometry(radius, radius, tireWidth, 32);
  tireGeo.rotateX(Math.PI / 2);
  disposables.push(tireGeo);

  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  rotator.add(tireMesh);

  // Sidewall chamfer ring
  const wallGeo = new THREE.TorusGeometry(radius * 0.78, radius * 0.19, 12, 32);
  disposables.push(wallGeo);
  const wallMesh = new THREE.Mesh(wallGeo, tireMat);
  wallMesh.position.z = isLeftSide ? tireWidth * 0.24 : -tireWidth * 0.24;
  rotator.add(wallMesh);

  // Outer alloy barrel
  const rimRadius = radius * 0.68;
  const barrelGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.02, 28);
  barrelGeo.rotateX(Math.PI / 2);
  disposables.push(barrelGeo);
  const barrelMesh = new THREE.Mesh(barrelGeo, rimMat);
  rotator.add(barrelMesh);

  // Brake rotor disc + caliper inside wheel
  const discGeo = new THREE.CylinderGeometry(rimRadius * 0.74, rimRadius * 0.74, 0.04, 24);
  discGeo.rotateX(Math.PI / 2);
  disposables.push(discGeo);
  const discMesh = new THREE.Mesh(discGeo, discMat);
  rotator.add(discMesh);

  const caliperGeo = new THREE.BoxGeometry(rimRadius * 0.34, rimRadius * 0.45, 0.1);
  disposables.push(caliperGeo);
  const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
  caliperMesh.position.set(rimRadius * 0.46, 0.04, isLeftSide ? 0.04 : -0.04);
  assembly.add(caliperMesh);

  // Spokes according to wheel style
  const spokeCount = style === 'sport' ? 5 : style === 'luxury' ? 10 : 6;
  const spokeThickness = style === 'sport' ? 0.042 : style === 'luxury' ? 0.026 : 0.048;
  const spokeGeo = new THREE.BoxGeometry(spokeThickness, rimRadius * 1.85, 0.035);
  disposables.push(spokeGeo);

  const zOffset = isLeftSide ? tireWidth / 2 + 0.005 : -(tireWidth / 2 + 0.005);
  for (let i = 0; i < spokeCount; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.z = (i * Math.PI) / spokeCount;
    spoke.position.z = zOffset;
    rotator.add(spoke);
  }

  // Center hub cap
  const hubGeo = new THREE.CylinderGeometry(rimRadius * 0.22, rimRadius * 0.22, tireWidth + 0.04, 18);
  hubGeo.rotateX(Math.PI / 2);
  disposables.push(hubGeo);
  const hubMesh = new THREE.Mesh(hubGeo, rimMat);
  rotator.add(hubMesh);

  assembly.add(rotator);
  return { assembly, rotator, disposables };
}

export function buildProceduralCar(
  archetype: BodyArchetype,
  paintHex: string,
  finish: FinishType,
  wheelStyle: WheelStyle,
): BuiltCarRig {
  const spec = ARCHETYPE_SPECS[archetype];
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  const wheelsGroup = new THREE.Group();
  const wheelRotators: THREE.Group[] = [];

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Shared materials with >= 0.25 roughness delta between paint, trim, tires, and glass
  const paintMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintHex),
    metalness: finish === 'metallic' ? 0.72 : 0.25,
    roughness: finish === 'metallic' ? 0.22 : 0.58,
    clearcoat: finish === 'metallic' ? 1.0 : 0.15,
    clearcoatRoughness: finish === 'metallic' ? 0.08 : 0.45,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0c121c'),
    metalness: 0.12,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#161920'),
    metalness: 0.18,
    roughness: 0.72,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#111317'),
    metalness: 0.05,
    roughness: 0.88,
  });

  const rimColor =
    wheelStyle === 'sport' ? '#d6b45d' : wheelStyle === 'luxury' ? '#e5e7eb' : '#9aa3b2';
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColor),
    metalness: 0.9,
    roughness: wheelStyle === 'luxury' ? 0.14 : 0.22,
  });

  const discMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5a6270'),
    metalness: 0.85,
    roughness: 0.35,
  });

  const caliperMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wheelStyle === 'sport' ? '#c60022' : '#d6b45d'),
    metalness: 0.4,
    roughness: 0.35,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#dceaff'),
    emissiveIntensity: 1.6,
    roughness: 0.1,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ff1e2d'),
    emissive: new THREE.Color('#cc0018'),
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d4dae3'),
    metalness: 0.95,
    roughness: 0.12,
  });

  materials.push(
    paintMaterial,
    glassMaterial,
    carbonMaterial,
    tireMaterial,
    rimMaterial,
    discMaterial,
    caliperMaterial,
    headlightMaterial,
    taillightMaterial,
    chromeMaterial,
  );

  // 1. Primary Silhouette: Sculpted Car Body Shell
  const bodyGeo = buildExtrudedBody(spec);
  geometries.push(bodyGeo);
  const bodyMesh = new THREE.Mesh(bodyGeo, paintMaterial);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  chassisGroup.add(bodyMesh);

  // 2. Secondary Read: Glasshouse / Canopy
  const glassGeo = buildCabinGlass(spec);
  geometries.push(glassGeo);
  const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
  glassMesh.castShadow = false;
  chassisGroup.add(glassMesh);

  // Lower Carbon Splitter & Side Skirts
  const splitterGeo = new THREE.BoxGeometry(spec.length + 0.08, 0.07, spec.width + 0.02);
  geometries.push(splitterGeo);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitterMesh.position.set(0, 0.03, 0);
  splitterMesh.castShadow = true;
  chassisGroup.add(splitterMesh);

  // Rear Diffuser
  const diffuserGeo = new THREE.BoxGeometry(0.24, 0.16, spec.width * 0.72);
  geometries.push(diffuserGeo);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuserMesh.position.set(-spec.length / 2 + 0.06, 0.12, 0);
  chassisGroup.add(diffuserMesh);

  // 3. Accent Details: Headlights, Taillights, Mirrors, Exhausts, Wing
  const halfLen = spec.length / 2;
  const halfW = spec.width / 2;

  // Dual LED Headlight Clusters
  const headlightGeo = new THREE.BoxGeometry(0.16, 0.06, 0.34);
  geometries.push(headlightGeo);
  for (const side of [-1, 1]) {
    const hl = new THREE.Mesh(headlightGeo, headlightMaterial);
    hl.position.set(halfLen - 0.05, spec.noseHeight * 0.75 + 0.06, side * (halfW - 0.34));
    hl.rotation.y = side * -0.18;
    chassisGroup.add(hl);
  }

  // Full-width LED Taillight Bar
  const taillightGeo = new THREE.BoxGeometry(0.08, 0.055, spec.width * 0.78);
  geometries.push(taillightGeo);
  const tailBar = new THREE.Mesh(taillightGeo, taillightMaterial);
  tailBar.position.set(-halfLen + 0.03, spec.tailHeight * 0.74, 0);
  chassisGroup.add(tailBar);

  // Side Mirrors
  const mirrorArmGeo = new THREE.BoxGeometry(0.14, 0.05, 0.18);
  geometries.push(mirrorArmGeo);
  for (const side of [-1, 1]) {
    const mirror = new THREE.Mesh(mirrorArmGeo, paintMaterial);
    mirror.position.set(spec.cabinEnd - 0.25, spec.bodyHeight + 0.06, side * (halfW + 0.04));
    mirror.castShadow = true;
    chassisGroup.add(mirror);
  }

  // Twin/Quad Exhaust Tips
  const exhaustGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.16, 16);
  exhaustGeo.rotateZ(Math.PI / 2);
  geometries.push(exhaustGeo);
  for (const zPos of [-0.52, -0.4, 0.4, 0.52]) {
    const pipe = new THREE.Mesh(exhaustGeo, chromeMaterial);
    pipe.position.set(-halfLen - 0.02, 0.11, zPos);
    chassisGroup.add(pipe);
  }

  // Rear Aero Wing (Sports / Supercar / Hypercar / Muscle)
  if (spec.hasWing) {
    const wingBladeGeo = new THREE.BoxGeometry(0.28, 0.04, spec.width * 0.94);
    const wingPylonGeo = new THREE.BoxGeometry(0.12, spec.wingHeight, 0.04);
    geometries.push(wingBladeGeo, wingPylonGeo);

    const wingBlade = new THREE.Mesh(wingBladeGeo, carbonMaterial);
    wingBlade.position.set(-halfLen + 0.16, spec.tailHeight + spec.wingHeight, 0);
    wingBlade.rotation.z = -0.08;
    wingBlade.castShadow = true;
    chassisGroup.add(wingBlade);

    for (const side of [-0.45, 0.45]) {
      const pylon = new THREE.Mesh(wingPylonGeo, carbonMaterial);
      pylon.position.set(-halfLen + 0.18, spec.tailHeight + spec.wingHeight / 2 - 0.02, side);
      chassisGroup.add(pylon);
    }
  }

  chassisGroup.position.y = spec.groundClearance;
  root.add(chassisGroup);

  // 4. Four Grounded Multi-Part Wheels (sat flush at y = wheelRadius so bottom sits at y = 0)
  const wheelCoords: Array<{ x: number; z: number; left: boolean }> = [
    { x: spec.frontAxleX, z: spec.wheelTrackZ, left: true },
    { x: spec.frontAxleX, z: -spec.wheelTrackZ, left: false },
    { x: spec.rearAxleX, z: spec.wheelTrackZ, left: true },
    { x: spec.rearAxleX, z: -spec.wheelTrackZ, left: false },
  ];

  for (const coord of wheelCoords) {
    const { assembly, rotator, disposables } = createWheelAssembly(
      spec.wheelRadius,
      wheelStyle,
      tireMaterial,
      rimMaterial,
      discMaterial,
      caliperMaterial,
      coord.left,
    );
    geometries.push(...disposables);
    assembly.position.set(coord.x, spec.wheelRadius, coord.z);
    wheelsGroup.add(assembly);
    wheelRotators.push(rotator);
  }

  root.add(wheelsGroup);

  return {
    root,
    chassisGroup,
    wheelsGroup,
    wheelRotators,
    paintMaterial,
    rimMaterial,
    caliperMaterial,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
