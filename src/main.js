import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import helvetiker from "three/examples/fonts/helvetiker_regular.typeface.json";
import { gsap } from "gsap";

const font = new FontLoader().parse(helvetiker);
const reducedPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionEnabled = !reducedPreference.matches;
let activeSection = "overview";
let renderer;
let controls;
let scene;
let camera;
let sceneRoot;
let raycaster;
let pointer;
let frameId;
let toastTimer;
const clock = new THREE.Clock();
const stationGroups = new Map();
const animatedFans = [];
const animatables = [];
const interactiveMeshes = [];
const worldObjects = {};

const CV = {
  name: "Olwethu Ngalo",
  phone: "075-021-1548",
  email: "olwethungalo@bardalesec.org.za",
  objective:
    "Dedicated IT professional combining hands-on printer hardware maintenance and office automation experience with a strong foundation in system support and Java programming. Seeking to leverage technical troubleshooting and problem-solving skills in a dynamic IT Support or Systems Development role.",
  skills: [
    "Java",
    "Technical support",
    "Analytical Problem Solving",
    "Printer Hardware Maintenance MFP",
    "JDK",
    "JRE",
    "Logic",
    "Mathematics",
    "Programming",
    "MySql",
    "Equipment Servicing",
    "Client-Side Support and User Guidance",
  ],
  experience: [
    {
      id: "raydian",
      role: "Technician (Printer Hardware & Office Automation) Intern",
      company: "Raydian Print & Office Automation Solutions",
      date: "06/2026 – 09/2026",
      dateShort: "JUN — SEP 2026",
      duties: [
        "Assisted with diagnosing, dismantling, and repairing mechanical and electrical printer hardware components.",
        "Supported on-site and workshop setups of new multi-function printers (MFPs) by configuring network connectivity and client-side driver software.",
        "Performed systematic troubleshooting for error codes, paper feeds, print quality, and connectivity.",
        "Executed routine preventive maintenance and component replacements (fusers, rollers, maintenance kits).",
        "Provided operational guidance to end-users while keeping accurate maintenance logs and service records.",
      ],
    },
    {
      id: "bemba",
      role: "Technical Support Intern",
      company: "BEMBA IT Solutions",
      date: "10/2025 – 05/2026",
      dateShort: "OCT 2025 — MAY 2026",
      duties: [
        "Performed systematic troubleshooting, component-level testing, and fault isolation for a wide variety of computer systems, including standard desktops, workstations, and high-performance gaming PCs.",
        "Handled complete hardware teardowns and builds, ensuring precise component installation, proper cable management, and optimal thermal performance for custom and pre-built rigs.",
        "Evaluated hardware performance bottlenecks and upgraded critical components such as CPUs, GPUs, RAM, motherboards, power supplies, and storage drives (HDD/SSD).",
        "Installed, configured, and activated various operating systems, ensuring proper driver integration, system updates, and baseline software setups for client readiness.",
        "Conducted rigorous stress testing, benchmarking, and hardware diagnostics post-repair to guarantee system stability and performance before client handover.",
      ],
    },
  ],
  education: [
    {
      year: "2025",
      title: "Java Certified Foundations Associate",
      issuer: "Issued by Oracle",
      kind: "CERTIFICATION",
    },
    {
      year: "2024",
      title: "Technical Support Fundamentals",
      issuer:
        "Coursera · online course authorized by Google and offered through Coursera",
      kind: "COURSE",
    },
    {
      year: "2023",
      title: "NQF Level 5 System development & System support",
      issuer: "On The Ball College",
      kind: "QUALIFICATION",
    },
    {
      year: "2021",
      title: "Higher Certificate in Information Systems",
      issuer: "Nelson Mandela University",
      kind: "CERTIFICATE",
    },
    {
      year: "2019",
      title: "Matric",
      issuer: "Bardale Secondary School",
      kind: "SCHOOL",
    },
  ],
  coursera: {
    date: "October 20, 2024",
    signer: "Amanda Brophy, Global Director of Google Career Certificates",
    verify: "https://coursera.org/verify/TKMY7MIR64MJ",
  },
};

const SECTIONS = [
  { id: "overview", n: "00", title: "ORBIT / OVERVIEW", color: 0xbaf5dd },
  { id: "skills", n: "01", title: "SKILL / MATRIX", color: 0x64d9ed },
  { id: "raydian", n: "02", title: "RAYDIAN / PRINT SYSTEMS", color: 0xffb875 },
  { id: "bemba", n: "03", title: "BEMBA / COMPUTE SYSTEMS", color: 0x8bc4ff },
  { id: "education", n: "04", title: "EDUCATION / ARCHIVE", color: 0xb9a5ff },
  { id: "contact", n: "05", title: "CONTACT / UPLINK", color: 0xbaf5dd },
];

const STATION_POSITIONS = {
  overview: new THREE.Vector3(1.4, 0, 0),
  skills: new THREE.Vector3(-3.4, -0.15, -2.4),
  raydian: new THREE.Vector3(4.3, -0.1, -1.5),
  bemba: new THREE.Vector3(3.2, 0, 3.7),
  education: new THREE.Vector3(-3.3, 0.1, 3.0),
  contact: new THREE.Vector3(0.2, 0.15, -5.8),
};

const COLORS = {
  mint: 0xbaf5dd,
  cyan: 0x64d9ed,
  amber: 0xffb875,
  blue: 0x8bc4ff,
  violet: 0xb9a5ff,
  ink: 0x0b121a,
  metal: 0x334650,
  glass: 0x162f3a,
};

function material(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.4,
    metalness: opts.metalness ?? 0.55,
    emissive: opts.emissive ?? color,
    emissiveIntensity: opts.emissiveIntensity ?? 0.045,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side,
    wireframe: opts.wireframe ?? false,
  });
}

function box(parent, size, position, mat, options = {}) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2], 1, 1, 1);
  if (options.morph) addMorphTarget(geo, options.morph);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addMorphTarget(
  geometry,
  { axis = "y", amount = 0.22, frequency = 2, scale = [0.84, 1.3, 0.94] } = {},
) {
  const base = geometry.attributes.position;
  const target = new Float32Array(base.count * 3);
  for (let i = 0; i < base.count; i += 1) {
    const x = base.getX(i);
    const y = base.getY(i);
    const z = base.getZ(i);
    const phase = Math.sin((x + y + z) * frequency * 3.1) * amount;
    target[i * 3] = x * scale[0] + (axis === "x" ? phase : 0);
    target[i * 3 + 1] = y * scale[1] + (axis === "y" ? phase : 0);
    target[i * 3 + 2] = z * scale[2] + (axis === "z" ? phase : 0);
  }
  geometry.morphAttributes.position = [
    new THREE.Float32BufferAttribute(target, 3),
  ];
  geometry.morphTargetsRelative = false;
}

function morphMesh(parent, size, position, mat, options = {}) {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2], 4, 4, 4);
  addMorphTarget(geo, options);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (mesh.morphTargetInfluences?.length)
    animatables.push({
      kind: "morph",
      target: mesh.morphTargetInfluences,
      idx: 0,
      phase: Math.random() * Math.PI * 2,
    });
  return mesh;
}

function animateMorph(mesh, duration = 3.7) {
  if (!mesh.morphTargetInfluences?.length) return;
  gsap.to(mesh.morphTargetInfluences, {
    0: 0.7,
    duration,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    delay: Math.random() * 1.2,
  });
}

function cylinder(
  parent,
  radiusTop,
  radiusBottom,
  height,
  position,
  mat,
  segments = 24,
  openEnded = false,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      segments,
      2,
      openEnded,
    ),
    mat,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addText(parent, text, position, options = {}) {
  const geo = new TextGeometry(text, {
    font,
    size: options.size ?? 0.16,
    depth: options.depth ?? 0.025,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  geo.computeBoundingBox();
  if (options.center !== false)
    geo.translate(-geo.boundingBox.getCenter(new THREE.Vector3()).x, 0, 0);
  const mesh = new THREE.Mesh(
    geo,
    material(options.color ?? COLORS.mint, {
      metalness: 0.42,
      roughness: 0.28,
      emissiveIntensity: 0.16,
    }),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function tube(parent, points, radius, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    closed,
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      curve,
      Math.max(28, points.length * 5),
      radius,
      8,
      closed,
    ),
    mat,
  );
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function setSectionTag(group, id) {
  group.traverse((child) => {
    if (child.isMesh) child.userData.section = id;
  });
}

function createPlatform(group, id, color) {
  const base = new THREE.Group();
  group.add(base);
  cylinder(
    base,
    1.22,
    1.35,
    0.12,
    [0, 0.04, 0],
    material(0x15222a, { metalness: 0.78, roughness: 0.33 }),
    64,
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.24, 0.018, 8, 96),
    material(color, {
      emissiveIntensity: 1.3,
      metalness: 0.25,
      roughness: 0.3,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.11;
  base.add(ring);
  const insetRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.93, 0.008, 6, 72),
    material(color, { emissiveIntensity: 0.55, metalness: 0.1 }),
  );
  insetRing.rotation.x = Math.PI / 2;
  insetRing.position.y = 0.12;
  base.add(insetRing);
  const spike = cylinder(
    group,
    0.045,
    0.08,
    0.45,
    [0, 0.33, 0],
    material(color, { emissiveIntensity: 0.22 }),
    12,
  );
  spike.scale.y = 0.72;
  addText(
    group,
    SECTIONS.find((s) => s.id === id)?.n ?? "00",
    [0, 0.16, 1.48],
    { size: 0.14, color, depth: 0.012 },
  );
  return base;
}

function makeStation(id, title, position, color, build) {
  const group = new THREE.Group();
  group.name = `${id}-station`;
  group.position.copy(position);
  group.userData.section = id;
  group.userData.home = position.clone();
  sceneRoot.add(group);
  stationGroups.set(id, group);
  createPlatform(group, id, color);
  build(group, color);
  addText(group, title.toUpperCase(), [0, 2.78, 0], {
    size: 0.115,
    color: 0xe1ebe7,
    depth: 0.01,
  });
  const marker = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.075, 1),
    material(color, { emissiveIntensity: 1.15 }),
  );
  marker.position.set(0, 3.02, 0);
  group.add(marker);
  const leader = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.22, 6),
    material(color, { emissiveIntensity: 0.7 }),
  );
  leader.position.set(0, 2.9, 0);
  group.add(leader);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.006, 6, 100),
    material(color, { emissiveIntensity: 0.45 }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.15;
  group.add(halo);
  animatables.push({
    kind: "float",
    target: group,
    phase: Math.random() * Math.PI * 2,
    baseY: position.y,
  });
  setSectionTag(group, id);
  return group;
}

function addPrinterDetails(parent, x, scale, production = false) {
  const rig = new THREE.Group();
  rig.position.set(x, 0.17, 0);
  rig.scale.setScalar(scale);
  parent.add(rig);
  const frameMat = material(0x74848b, { metalness: 0.84, roughness: 0.27 });
  const shellMat = material(production ? 0x394954 : 0x2f3d46, {
    metalness: 0.67,
    roughness: 0.34,
  });
  const faceMat = material(0x14212a, { metalness: 0.52, roughness: 0.29 });
  const lightMat = material(production ? COLORS.amber : COLORS.cyan, {
    metalness: 0.12,
    roughness: 0.22,
    emissiveIntensity: 1.25,
  });
  const width = production ? 1.22 : 1.06;
  const depth = production ? 0.91 : 0.78;
  const bodyH = production ? 1.3 : 0.78;
  const chassis = morphMesh(
    rig,
    [width, bodyH, depth],
    [0, 0.69 + bodyH / 2, 0],
    shellMat,
    {
      axis: "y",
      amount: 0.075,
      frequency: 1.7,
      scale: [production ? 0.96 : 0.78, production ? 1.18 : 1.42, 0.94],
    },
  );
  animateMorph(chassis, production ? 4.1 : 3.4);
  const footY = 0.16;
  if (production) {
    for (const px of [-0.51, 0.51])
      for (const pz of [-0.36, 0.36]) {
        cylinder(rig, 0.045, 0.06, 0.28, [px, footY, pz], frameMat, 12);
        cylinder(
          rig,
          0.11,
          0.1,
          0.07,
          [px, 0.05, pz],
          material(0x12191e, { metalness: 0.8 }),
          16,
        );
      }
    for (const px of [-0.58, 0.58])
      for (const py of [0.48, 1.12, 1.68]) {
        const rail = box(rig, [0.045, 0.07, 0.83], [px, py, 0], frameMat);
        rail.castShadow = true;
      }
  } else {
    cylinder(rig, 0.09, 0.12, 0.34, [-0.34, 0.28, -0.22], frameMat, 16);
    cylinder(rig, 0.09, 0.12, 0.34, [0.34, 0.28, -0.22], frameMat, 16);
  }
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, production ? 1.98 : 1.04, -depth * 0.35);
  rig.add(lidPivot);
  box(
    lidPivot,
    [width * 0.94, 0.11, depth * 0.85],
    [0, 0.02, 0.05],
    material(0x708087, { metalness: 0.76, roughness: 0.3 }),
  );
  const scannerGlass = box(
    lidPivot,
    [width * 0.7, 0.018, depth * 0.59],
    [0, 0.08, 0.04],
    material(0x8ce3e4, {
      transparent: true,
      opacity: 0.42,
      metalness: 0.48,
      roughness: 0.12,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.1,
    }),
  );
  scannerGlass.material.side = THREE.DoubleSide;
  gsap.to(lidPivot.rotation, {
    x: production ? -0.11 : -0.22,
    duration: 2.8,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: Math.random() * 1.3,
  });
  const trayCount = production ? 3 : 2;
  for (let i = 0; i < trayCount; i += 1) {
    const trayY = production ? 0.39 + i * 0.34 : 0.35 + i * 0.2;
    const tray = box(
      rig,
      [width * 0.76, 0.12, depth * 0.56],
      [0, trayY, depth * 0.48],
      faceMat,
    );
    box(
      rig,
      [width * 0.48, 0.016, 0.035],
      [0, trayY + 0.071, depth * 0.79],
      material(0x9eafb5, { metalness: 0.78, roughness: 0.3 }),
    );
    gsap.to(tray.position, {
      z: depth * (production ? 0.57 : 0.59),
      duration: 3.2 + i * 0.25,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0.3 * i,
    });
  }
  const display = box(
    rig,
    [production ? 0.32 : 0.27, 0.23, 0.045],
    [width * 0.29, production ? 1.43 : 0.81, depth * 0.52],
    material(0x0b151d, { metalness: 0.25, roughness: 0.2 }),
  );
  display.rotation.x = -0.1;
  box(
    rig,
    [production ? 0.24 : 0.2, 0.12, 0.006],
    [width * 0.29, production ? 1.44 : 0.82, depth * 0.55],
    lightMat,
  );
  cylinder(
    rig,
    0.055,
    0.055,
    0.018,
    [-width * 0.3, production ? 1.44 : 0.82, depth * 0.53],
    lightMat,
    18,
  );
  // Service path and visible roller set.
  const rollerY = production ? 1.45 : 0.88;
  for (let i = -1; i <= 1; i += 1) {
    const roller = cylinder(
      rig,
      0.03,
      0.03,
      width * 0.5,
      [i * 0.16, rollerY, depth * 0.4],
      material(0x89989a, { metalness: 0.88, roughness: 0.27 }),
      16,
    );
    roller.rotation.z = Math.PI / 2;
    gsap.to(roller.rotation, {
      y: Math.PI * 2,
      duration: 4 + Math.abs(i),
      repeat: -1,
      ease: "none",
    });
  }
  const paper = box(
    rig,
    [0.36, 0.008, production ? 0.46 : 0.3],
    [0, production ? 1.78 : 1.1, depth * 0.78],
    material(0xd7ddd6, { metalness: 0.04, roughness: 0.84 }),
  );
  gsap.to(paper.position, {
    y: paper.position.y + 0.23,
    duration: 2.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  for (let side = -1; side <= 1; side += 2) {
    const status = new THREE.Mesh(
      new THREE.SphereGeometry(0.027, 12, 10),
      lightMat,
    );
    status.position.set(
      side * width * 0.42,
      production ? 1.68 : 1.08,
      depth * 0.3,
    );
    rig.add(status);
    gsap.to(status.material, {
      emissiveIntensity: 1.8,
      duration: 1.1 + Math.random(),
      repeat: -1,
      yoyo: true,
    });
  }
  const weight = box(
    rig,
    [0.21, 0.2, 0.08],
    [width * 0.28, 0.3, depth * 0.55],
    material(0x121b22, { metalness: 0.45 }),
  );
  for (let i = 0; i < 3; i += 1)
    box(
      rig,
      [0.14, 0.014, 0.012],
      [width * 0.28, 0.33 - i * 0.045, depth * 0.6],
      material(0x80dcca, { emissiveIntensity: 0.55 }),
    );
  addText(
    rig,
    production ? "MFP / 9000" : "MFP / 01",
    [0, 0.15, depth * 0.59],
    { size: 0.07, color: COLORS.mint, depth: 0.008 },
  );
  return rig;
}

function buildRaydian(group) {
  const compact = addPrinterDetails(group, -0.72, 0.9, false);
  const production = addPrinterDetails(group, 0.85, 0.82, true);
  production.position.y += 0.09;
  worldObjects.raydian = { compact, production };
  const serviceArc = new THREE.Mesh(
    new THREE.TorusGeometry(1.95, 0.012, 8, 100, Math.PI * 1.24),
    material(COLORS.amber, { emissiveIntensity: 0.55 }),
  );
  serviceArc.rotation.x = Math.PI / 2;
  serviceArc.position.set(0, 2.25, 0.04);
  group.add(serviceArc);
  addText(group, "MFP / DIAGNOSTICS / MAINTENANCE", [0, 0.24, 1.77], {
    size: 0.08,
    color: COLORS.amber,
    depth: 0.009,
  });
}

function makeFan(parent, position, radius, tint) {
  const fan = new THREE.Group();
  fan.position.set(...position);
  parent.add(fan);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.027, 8, 36),
    material(tint, { emissiveIntensity: 0.78, metalness: 0.38 }),
  );
  fan.add(ring);
  cylinder(
    fan,
    radius * 0.18,
    radius * 0.18,
    0.06,
    [0, 0, 0],
    material(0x98a6ae, { metalness: 0.8 }),
    16,
  );
  for (let i = 0; i < 7; i += 1) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 0.64, radius * 0.11, 0.018),
      material(i % 2 ? 0x668b91 : 0x3d6d75, {
        metalness: 0.55,
        roughness: 0.3,
        emissive: tint,
        emissiveIntensity: 0.13,
      }),
    );
    blade.position.set(radius * 0.28, 0, 0.015);
    blade.rotation.z = i * ((Math.PI * 2) / 7) + 0.28;
    fan.add(blade);
  }
  animatedFans.push({ fan, speed: 0.42 + Math.random() * 0.26 });
  return fan;
}

function buildBemba(group) {
  const rig = new THREE.Group();
  rig.position.set(0, 0.22, 0);
  group.add(rig);
  const caseMat = material(0x17242d, { metalness: 0.77, roughness: 0.24 });
  const glassMat = material(0x255663, {
    transparent: true,
    opacity: 0.25,
    metalness: 0.12,
    roughness: 0.16,
    emissive: COLORS.cyan,
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });
  const frameMat = material(0x586b74, { metalness: 0.88, roughness: 0.25 });
  box(rig, [1.32, 1.9, 0.82], [0, 1.17, 0], caseMat);
  // Slim rails and transparent front panel make the chassis legible from the orbit camera.
  box(rig, [1.2, 1.78, 0.025], [0, 1.18, 0.427], glassMat);
  for (const x of [-0.62, 0.62])
    box(rig, [0.045, 1.84, 0.92], [x, 1.16, 0], frameMat);
  for (const y of [0.29, 2.07])
    box(rig, [1.29, 0.045, 0.9], [0, y, 0], frameMat);
  const motherboard = box(
    rig,
    [0.78, 1.45, 0.055],
    [0.07, 1.2, 0.22],
    material(0x315d62, {
      metalness: 0.74,
      roughness: 0.3,
      emissive: 0x244950,
      emissiveIntensity: 0.12,
    }),
  );
  for (let i = 0; i < 4; i += 1) {
    box(
      rig,
      [0.13, 0.36, 0.085],
      [-0.28 + i * 0.17, 1.72, 0.17],
      material(i % 2 ? 0x93c9c2 : 0x587c87, {
        metalness: 0.62,
        roughness: 0.24,
        emissive: 0x16404a,
        emissiveIntensity: 0.08,
      }),
    );
  }
  box(
    rig,
    [0.38, 0.39, 0.13],
    [0.1, 1.65, 0.12],
    material(0x152128, { metalness: 0.72, roughness: 0.24 }),
  );
  cylinder(
    rig,
    0.13,
    0.13,
    0.045,
    [0.1, 1.65, 0.2],
    material(COLORS.cyan, { emissiveIntensity: 0.85 }),
    24,
  );
  // GPU, power supply, and three drive/storage silhouettes.
  box(
    rig,
    [0.94, 0.22, 0.19],
    [0.03, 0.91, 0.16],
    material(0x182b34, { metalness: 0.75, roughness: 0.27 }),
  );
  box(
    rig,
    [0.55, 0.035, 0.015],
    [0.03, 0.91, 0.26],
    material(COLORS.mint, { emissiveIntensity: 0.82 }),
  );
  box(
    rig,
    [0.6, 0.18, 0.37],
    [0.18, 0.43, -0.05],
    material(0x263941, { metalness: 0.82, roughness: 0.32 }),
  );
  for (let i = 0; i < 3; i += 1)
    box(
      rig,
      [0.42, 0.035, 0.018],
      [0.18, 0.39 - i * 0.05, 0.15],
      material(0x64d9ed, { emissiveIntensity: 0.42 }),
    );
  // Flexible cable paths route cleanly between component bays.
  tube(
    rig,
    [
      [-0.49, 1.95, 0.18],
      [-0.38, 1.86, 0.28],
      [-0.5, 1.55, 0.24],
      [-0.43, 0.98, 0.28],
    ],
    0.022,
    material(0xffad75, { metalness: 0.25, emissiveIntensity: 0.17 }),
  );
  tube(
    rig,
    [
      [0.43, 1.98, 0.08],
      [0.52, 1.7, 0.16],
      [0.45, 1.05, 0.15],
      [0.49, 0.5, 0.15],
    ],
    0.018,
    material(0x7583f2, { metalness: 0.32, emissiveIntensity: 0.18 }),
  );
  makeFan(rig, [-0.39, 1.91, 0.4], 0.17, COLORS.cyan);
  makeFan(rig, [0.43, 1.89, 0.4], 0.17, COLORS.mint);
  makeFan(rig, [0, 0.43, 0.4], 0.17, COLORS.violet);
  const frontLight = box(
    rig,
    [0.035, 1.5, 0.028],
    [0.64, 1.2, 0.44],
    material(COLORS.cyan, { emissiveIntensity: 1.05 }),
  );
  gsap.to(frontLight.material, {
    emissiveIntensity: 1.5,
    duration: 1.8,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  for (let x = -0.56; x <= 0.57; x += 1.12)
    for (let z of [-0.31, 0.31])
      cylinder(rig, 0.045, 0.05, 0.28, [x, 0.13, z], frameMat, 12);
  const cableAccent = new THREE.Mesh(
    new THREE.TorusGeometry(1.47, 0.012, 8, 90),
    material(COLORS.blue, { emissiveIntensity: 0.45 }),
  );
  cableAccent.rotation.x = Math.PI / 2;
  cableAccent.position.y = 2.11;
  group.add(cableAccent);
  const monitor = new THREE.Group();
  monitor.position.set(-1.02, 0.43, -0.2);
  rig.add(monitor);
  box(
    monitor,
    [0.73, 0.51, 0.075],
    [0, 1.2, 0],
    material(0x21313a, { metalness: 0.7 }),
  );
  box(
    monitor,
    [0.64, 0.42, 0.014],
    [0, 1.2, 0.045],
    material(0x96edcf, {
      emissive: COLORS.cyan,
      emissiveIntensity: 0.12,
      roughness: 0.16,
    }),
  );
  box(
    monitor,
    [0.07, 0.42, 0.05],
    [-0.22, 1.2, 0.06],
    material(0x16202a, { emissive: COLORS.mint, emissiveIntensity: 0.08 }),
  );
  box(monitor, [0.21, 0.035, 0.07], [0, 0.89, 0], frameMat);
  box(monitor, [0.4, 0.045, 0.25], [0, 0.84, 0], frameMat);
  worldObjects.bemba = { rig, motherboard, monitor };
}

function makeDolphinGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.84, -0.11);
  shape.bezierCurveTo(-0.64, 0.13, -0.45, 0.42, -0.08, 0.43);
  shape.bezierCurveTo(0.2, 0.44, 0.43, 0.22, 0.5, -0.01);
  shape.bezierCurveTo(0.59, 0.02, 0.77, 0.1, 0.97, 0.06);
  shape.bezierCurveTo(0.87, -0.07, 0.76, -0.14, 0.58, -0.15);
  shape.bezierCurveTo(0.43, -0.46, 0.16, -0.59, -0.17, -0.5);
  shape.bezierCurveTo(-0.43, -0.45, -0.59, -0.27, -0.84, -0.11);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.03,
    curveSegments: 18,
  });
  geo.center();
  addMorphTarget(geo, {
    axis: "y",
    amount: 0.055,
    frequency: 2.2,
    scale: [1.14, 0.87, 1.12],
  });
  return geo;
}

function buildSkills(group) {
  const logos = new THREE.Group();
  group.add(logos);
  const java = new THREE.Group();
  java.position.set(-0.82, 1.31, 0.1);
  logos.add(java);
  const cupMat = material(0xffb875, {
    metalness: 0.43,
    roughness: 0.24,
    emissive: 0x6b2b12,
    emissiveIntensity: 0.08,
    side: THREE.DoubleSide,
  });
  const cupGeo = new THREE.CylinderGeometry(0.31, 0.23, 0.48, 32, 4, true);
  addMorphTarget(cupGeo, {
    axis: "y",
    amount: 0.05,
    frequency: 1.4,
    scale: [1.22, 0.82, 1.22],
  });
  const cupBody = new THREE.Mesh(cupGeo, cupMat);
  cupBody.position.y = 0.29;
  java.add(cupBody);
  if (cupBody.morphTargetInfluences?.length) animateMorph(cupBody, 3.2);
  const coffee = cylinder(
    java,
    0.275,
    0.275,
    0.022,
    [0, 0.51, 0],
    material(0x352519, { roughness: 0.24, metalness: 0.1, emissive: 0x190805 }),
  );
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.046, 12, 32, Math.PI * 1.46),
    cupMat,
  );
  handle.position.set(0.34, 0.29, 0);
  handle.rotation.set(0, 0, -Math.PI * 0.73);
  java.add(handle);
  cylinder(
    java,
    0.44,
    0.44,
    0.045,
    [0, 0.03, 0],
    material(0x6a7b7d, { metalness: 0.65, roughness: 0.25 }),
    32,
  );
  addText(java, "JAVA", [0, -0.35, 0.1], {
    size: 0.2,
    color: COLORS.amber,
    depth: 0.045,
  });
  for (let i = 0; i < 3; i += 1) {
    const steam = tube(
      java,
      [
        [-0.14 + i * 0.12, 0.59, 0],
        [-0.17 + i * 0.12, 0.69, 0],
        [-0.11 + i * 0.12, 0.8, 0],
      ],
      0.018,
      material(COLORS.amber, { emissiveIntensity: 0.68 }),
    );
    gsap.to(steam.position, {
      y: 0.1,
      duration: 1.8 + i * 0.25,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }
  const mysql = new THREE.Group();
  mysql.position.set(0.86, 1.35, 0.03);
  logos.add(mysql);
  const dolphin = new THREE.Mesh(
    makeDolphinGeometry(),
    material(0x6fa9ad, {
      metalness: 0.74,
      roughness: 0.23,
      emissive: 0x1d5159,
      emissiveIntensity: 0.09,
    }),
  );
  dolphin.morphTargetInfluences?.length && animateMorph(dolphin, 4.2);
  mysql.add(dolphin);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 12, 10),
    material(0xefffe9, { emissive: 0xd7fff2, emissiveIntensity: 0.9 }),
  );
  eye.position.set(-0.34, 0.11, 0.1);
  mysql.add(eye);
  addText(mysql, "MySQL", [0, -0.43, 0.12], {
    size: 0.18,
    color: COLORS.cyan,
    depth: 0.04,
  });
  // Curling energy wave gives the dolphin silhouette a distinct moving 3D footprint.
  const wave = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.01, 6, 80, Math.PI * 1.28),
    material(COLORS.cyan, { emissiveIntensity: 0.65 }),
  );
  wave.rotation.set(0.48, -0.2, 0.18);
  wave.position.y = -0.12;
  mysql.add(wave);
  gsap.to(java.rotation, {
    y: Math.PI * 0.22,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(mysql.rotation, {
    y: -Math.PI * 0.23,
    duration: 5.4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.2,
  });
  gsap.to(java.position, {
    y: java.position.y + 0.12,
    duration: 2.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(mysql.position, {
    y: mysql.position.y - 0.1,
    duration: 2.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.4,
  });
  for (const [x, y] of [
    [-0.95, 2.35],
    [0.94, 2.35],
  ]) {
    const spark = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.085, 1),
      material(x < 0 ? COLORS.amber : COLORS.cyan, { emissiveIntensity: 1.1 }),
    );
    spark.position.set(x, y, 0);
    group.add(spark);
    gsap.to(spark.rotation, {
      y: Math.PI * 2,
      x: Math.PI,
      duration: 7,
      repeat: -1,
      ease: "none",
    });
  }
  worldObjects.skills = { java, mysql, cupBody, dolphin };
  addText(group, "JAVA / MYSQL / SUPPORT", [0, 0.26, 1.78], {
    size: 0.085,
    color: COLORS.cyan,
    depth: 0.009,
  });
}

function buildEducation(group) {
  const rail = new THREE.Group();
  group.add(rail);
  for (let i = 0; i < CV.education.length; i += 1) {
    const item = CV.education[i];
    const x = (i - 2) * 0.45;
    const height = 0.5 + (4 - i) * 0.12;
    cylinder(
      rail,
      0.04,
      0.045,
      height,
      [x, height / 2 + 0.15, 0],
      material(COLORS.violet, { emissiveIntensity: 0.3 }),
      12,
    );
    const node = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.11, 1),
      material(i === 0 ? COLORS.mint : COLORS.violet, {
        emissiveIntensity: 0.9,
      }),
    );
    node.position.set(x, height + 0.24, 0);
    rail.add(node);
    const plaque = box(
      rail,
      [0.33, 0.16, 0.1],
      [x, 0.35, 0.25],
      material(0x202c39, { metalness: 0.63, roughness: 0.34 }),
    );
    plaque.rotation.y = (i - 2) * 0.11;
    addText(rail, item.year, [x, 0.58, 0.4], {
      size: 0.08,
      color: COLORS.mint,
      depth: 0.01,
    });
    gsap.to(node.position, {
      y: node.position.y + 0.11,
      duration: 1.9 + i * 0.22,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: i * 0.18,
    });
  }
  const cert = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.48, 0),
    material(0xb9a5ff, {
      transparent: true,
      opacity: 0.4,
      emissiveIntensity: 0.2,
      wireframe: true,
    }),
  );
  cert.position.set(0, 1.16, -0.45);
  group.add(cert);
  gsap.to(cert.rotation, {
    x: Math.PI * 2,
    y: Math.PI * 2,
    duration: 12,
    repeat: -1,
    ease: "none",
  });
  addText(group, "LEARNING / 2019—2025", [0, 0.24, 1.65], {
    size: 0.08,
    color: COLORS.violet,
    depth: 0.009,
  });
  worldObjects.education = rail;
}

function makeContactLabel(group, label, x, color) {
  const text = addText(group, label, [x, 0.49, 0.31], {
    size: 0.12,
    color,
    depth: 0.02,
  });
  return text;
}

function buildContact(group) {
  const phone = new THREE.Group();
  phone.position.set(-0.72, 1.35, 0.25);
  group.add(phone);
  const phonePath = [
    [-0.24, 0.38, 0],
    [-0.35, 0.56, 0],
    [-0.29, 0.75, 0],
    [-0.08, 0.89, 0],
    [0.12, 0.83, 0],
    [0.2, 0.66, 0],
  ];
  tube(
    phone,
    phonePath,
    0.082,
    material(COLORS.mint, {
      metalness: 0.61,
      roughness: 0.26,
      emissiveIntensity: 0.55,
    }),
  );
  for (const [x, y, r] of [
    [-0.23, 0.4, 0.09],
    [0.17, 0.68, 0.085],
  ]) {
    const end = new THREE.Mesh(
      new THREE.SphereGeometry(r, 20, 16),
      material(COLORS.mint, { metalness: 0.46, emissiveIntensity: 0.35 }),
    );
    end.position.set(x, y, 0);
    phone.add(end);
  }
  cylinder(
    phone,
    0.43,
    0.43,
    0.035,
    [0, 0.02, 0],
    material(0x21312f, { metalness: 0.66 }),
    32,
  );
  makeContactLabel(phone, "CALL", 0, COLORS.mint);
  phone.userData.href = `tel:${CV.phone.replaceAll("-", "")}`;
  phone.userData.contactIcon = true;
  phone.traverse((node) => {
    if (node.isMesh) node.userData.href = phone.userData.href;
  });
  const envelope = new THREE.Group();
  envelope.position.set(0.81, 1.34, 0.21);
  group.add(envelope);
  box(
    envelope,
    [0.92, 0.59, 0.13],
    [0, 0.38, 0],
    material(0x243d47, { metalness: 0.67, roughness: 0.28 }),
  );
  tube(
    envelope,
    [
      [-0.45, 0.65, 0.08],
      [0, 0.34, 0.09],
      [0.45, 0.65, 0.08],
    ],
    0.025,
    material(COLORS.cyan, { emissiveIntensity: 0.42 }),
  );
  tube(
    envelope,
    [
      [-0.43, 0.12, 0.08],
      [-0.08, 0.41, 0.09],
    ],
    0.019,
    material(0x9de8e1, { emissiveIntensity: 0.3 }),
  );
  tube(
    envelope,
    [
      [0.43, 0.12, 0.08],
      [0.08, 0.41, 0.09],
    ],
    0.019,
    material(0x9de8e1, { emissiveIntensity: 0.3 }),
  );
  cylinder(
    envelope,
    0.43,
    0.43,
    0.035,
    [0, 0.02, 0],
    material(0x1d3039, { metalness: 0.66 }),
    32,
  );
  makeContactLabel(envelope, "MAIL", 0, COLORS.cyan);
  envelope.userData.href = `mailto:${CV.email}`;
  envelope.userData.contactIcon = true;
  envelope.traverse((node) => {
    if (node.isMesh) node.userData.href = envelope.userData.href;
  });
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(1.66, 0.009, 7, 90),
    material(COLORS.mint, { emissiveIntensity: 0.7 }),
  );
  orbit.rotation.set(0.84, 0.08, 0.13);
  orbit.position.y = 1.2;
  group.add(orbit);
  gsap.to(phone.rotation, {
    y: 0.22,
    duration: 2.3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(envelope.rotation, {
    y: -0.2,
    duration: 2.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.3,
  });
  gsap.to(orbit.rotation, {
    z: Math.PI * 2,
    duration: 18,
    repeat: -1,
    ease: "none",
  });
  worldObjects.contact = { phone, envelope };
}

function createOverview(group) {
  const core = new THREE.Group();
  core.position.y = 0.32;
  group.add(core);
  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.94, 3),
    material(0x173040, {
      metalness: 0.78,
      roughness: 0.22,
      emissive: 0x0f3542,
      emissiveIntensity: 0.35,
      wireframe: true,
    }),
  );
  core.add(orb);
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 2),
    material(COLORS.mint, {
      transparent: true,
      opacity: 0.16,
      emissiveIntensity: 0.42,
      wireframe: true,
    }),
  );
  inner.rotation.set(0.4, 0.15, 0.3);
  core.add(inner);
  for (let i = 0; i < 5; i += 1) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + (i % 2) * 0.02, 10, 8),
      material(
        [COLORS.mint, COLORS.cyan, COLORS.amber, COLORS.violet, COLORS.blue][i],
        { emissiveIntensity: 1.4 },
      ),
    );
    dot.position.set(
      Math.cos((i * Math.PI * 2) / 5) * 1.28,
      0.14 + Math.sin(i * 3.4) * 0.32,
      Math.sin((i * Math.PI * 2) / 5) * 1.28,
    );
    core.add(dot);
  }
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.014, 8, 96),
    material(COLORS.mint, { emissiveIntensity: 0.65 }),
  );
  orbit.rotation.set(0.68, 0.2, 0.32);
  core.add(orbit);
  const orbit2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.008, 6, 96),
    material(COLORS.cyan, { emissiveIntensity: 0.4 }),
  );
  orbit2.rotation.set(0.36, 0.55, -0.6);
  core.add(orbit2);
  gsap.to(core.rotation, {
    y: Math.PI * 2,
    x: 0.45,
    duration: 32,
    repeat: -1,
    ease: "none",
  });
  worldObjects.overview = core;
}

function createStarField() {
  const count = 1500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xbaf5dd),
    new THREE.Color(0x64d9ed),
    new THREE.Color(0x7387c9),
    new THREE.Color(0xffb875),
  ];
  for (let i = 0; i < count; i += 1) {
    const radius = 8 + Math.random() * 27;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.58;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.73,
      sizeAttenuation: true,
    }),
  );
  scene.add(points);
  gsap.to(points.rotation, {
    y: Math.PI * 2,
    duration: 180,
    repeat: -1,
    ease: "none",
  });
  const constellation = new THREE.Group();
  scene.add(constellation);
  const wireMat = material(0x78a7ad, {
    transparent: true,
    opacity: 0.16,
    emissive: 0x284e59,
    emissiveIntensity: 0.4,
  });
  const starPoints = [
    [-6, 3.2, -4],
    [-3.3, 4.8, -7],
    [-0.4, 2.9, -3],
    [3.8, 4.3, -6],
    [6.7, 2.2, -1],
    [4.6, -2.3, 4],
    [0.2, -3.2, 6.5],
    [-4.4, -1.5, 4.3],
    [-7, 0.4, -0.5],
  ];
  for (let i = 0; i < starPoints.length - 1; i += 1) {
    tube(constellation, [starPoints[i], starPoints[i + 1]], 0.006, wireMat);
  }
}

function createScene() {
  const host = document.querySelector("#canvas-host");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080c14);
  scene.fog = new THREE.FogExp2(0x080c14, 0.023);
  camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    120,
  );
  camera.position.set(0, 3.8, 13.2);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = false;
  renderer.domElement.setAttribute("tabindex", "-1");
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x8baeb9, 0x080b13, 2.05));
  const key = new THREE.PointLight(0x85efd2, 65, 38, 2);
  key.position.set(-4, 7, 8);
  scene.add(key);
  const blue = new THREE.PointLight(0x63a9f7, 70, 38, 2);
  blue.position.set(6, 5, -3);
  scene.add(blue);
  const amber = new THREE.PointLight(0xffb875, 48, 25, 2);
  amber.position.set(-7, 3, -4);
  scene.add(amber);
  const bottom = new THREE.PointLight(0x276e7e, 45, 34, 2);
  bottom.position.set(1, -5, 4);
  scene.add(bottom);

  sceneRoot = new THREE.Group();
  scene.add(sceneRoot);
  createStarField();
  makeStation(
    "overview",
    "Career objective",
    STATION_POSITIONS.overview,
    COLORS.mint,
    createOverview,
  );
  makeStation(
    "skills",
    "Skills / stack",
    STATION_POSITIONS.skills,
    COLORS.cyan,
    buildSkills,
  );
  makeStation(
    "raydian",
    "Raydian / MFP",
    STATION_POSITIONS.raydian,
    COLORS.amber,
    buildRaydian,
  );
  makeStation(
    "bemba",
    "BEMBA / PC systems",
    STATION_POSITIONS.bemba,
    COLORS.blue,
    buildBemba,
  );
  makeStation(
    "education",
    "Education / credentials",
    STATION_POSITIONS.education,
    COLORS.violet,
    buildEducation,
  );
  makeStation(
    "contact",
    "Contact / uplink",
    STATION_POSITIONS.contact,
    COLORS.mint,
    buildContact,
  );
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.minDistance = 7.2;
  controls.maxDistance = 18;
  controls.minPolarAngle = 0.52;
  controls.maxPolarAngle = 1.49;
  controls.enablePan = false;
  controls.target.set(0, 1.08, 0);
  controls.update();
  renderer.domElement.addEventListener("click", onCanvasClick);
  renderer.domElement.addEventListener("pointermove", onCanvasPointerMove);
  animate();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shell(title, kicker, index, body, metadata = "") {
  return `<div class="panel-index">${index} / 06</div><div class="content-kicker">${kicker}</div><h2>${title}</h2>${body}<div class="content-meta"><span class="signal"></span><span>OLWETHU NGALO</span><span class="meta-sep">/</span><span>${metadata || "TECHNICAL SUPPORT · JAVA"}</span></div>`;
}

function renderOverview() {
  return `<div class="content-kicker">PROFILE / SYSTEMS SUPPORT</div>
    <div class="hero-name-line"><span class="name-rule"></span><span>TECHNICAL SUPPORT · SYSTEMS DEVELOPMENT</span></div>
    <h1>OLWETHU<br />NGALO</h1>
    <p class="hero-role">I keep systems moving — from the printer floor to the Java runtime.</p>
    <p class="hero-intro">${escapeHtml(CV.objective)}</p>
    <div class="hero-meta"><span>06 STATIONS</span><span>REAL-TIME WEBGL</span><span>PRINT / SYSTEMS</span></div>
    <div class="hero-actions"><button type="button" class="action-button" data-section="raydian">EXPLORE THE FIELD NOTES <span class="action-arrow">↗</span></button><button type="button" class="action-button secondary" data-section="education">OPEN THE CV <span class="action-arrow">→</span></button></div>
    <div class="content-meta"><span class="signal"></span><span>FIELD SYSTEMS ONLINE</span><span class="meta-sep">/</span><span>DRAG THE WORLD TO ORBIT</span></div>`;
}

function renderSkills() {
  const skillTags = CV.skills
    .map(
      (skill, i) =>
        `<span class="skill-tag ${i < 2 || skill === "MySql" ? "core" : ""}">${escapeHtml(skill)}</span>`,
    )
    .join("");
  return shell(
    "Skills &amp;<br />tech stack",
    "CAPABILITY / 01",
    "01",
    `<p class="panel-lead">A practical support foundation with Java and MySQL at the center. The models orbit the complete skill set listed in the CV.</p><div class="section-rail"><span>01</span><span>COMPETENCY CONSTELLATION</span></div><div class="skill-cloud" aria-label="All CV skills">${skillTags}</div><p class="entry-copy">Java runtime foundations (JDK / JRE), logic and mathematics sit alongside hands-on support: printer maintenance, equipment servicing, client-side support and user guidance.</p>`,
    "JAVA · MYSQL · TECH SUPPORT",
  );
}

function renderExperience(experience, index) {
  const duties = experience.duties
    .map((duty) => `<li>${escapeHtml(duty)}</li>`)
    .join("");
  return `<article class="entry-card"><div class="entry-top"><div><h3 class="entry-title">${escapeHtml(experience.role)}</h3><p class="entry-company">${escapeHtml(experience.company)}</p></div><span class="entry-date">${escapeHtml(experience.date)}</span></div><ol class="entry-details" aria-label="Responsibilities">${duties}</ol></article>`;
}

function renderRaydian() {
  return shell(
    "Print systems<br />in the field",
    "EXPERIENCE / 02",
    "02",
    `<p class="panel-lead">A printer hardware and office automation internship built around diagnosis, repair and client-ready MFP setups.</p><div class="section-rail"><span>06/2026 — 09/2026</span><span>RAYDIAN / SERVICE BAY</span></div>${renderExperience(CV.experience[0], 0)}<p class="entry-copy" style="margin-top:12px">Animated objects: a compact multifunction printer and a larger production MFP, moving through a simulated service cycle.</p>`,
    "PRINTER HARDWARE · OFFICE AUTOMATION",
  );
}

function renderBemba() {
  return shell(
    "Systems built<br />to perform",
    "EXPERIENCE / 03",
    "03",
    `<p class="panel-lead">Diagnostics, component upgrades and careful system assembly — from standard desktops to high-performance gaming PCs.</p><div class="section-rail"><span>10/2025 — 05/2026</span><span>BEMBA / HARDWARE LAB</span></div>${renderExperience(CV.experience[1], 1)}<p class="entry-copy" style="margin-top:12px">Explore the transparent rig model: fans, GPU, RAM, motherboard, power and storage zones are represented inside the tower.</p>`,
    "TECHNICAL SUPPORT · PC SYSTEMS",
  );
}

function renderEducation() {
  const items = CV.education
    .map(
      (item) =>
        `<li class="education-item"><div class="education-year">${escapeHtml(item.year)} <span class="meta-sep">/</span> ${escapeHtml(item.kind)}</div><h3 class="education-title">${escapeHtml(item.title)}</h3><p class="education-copy">${escapeHtml(item.issuer)}</p>${item.year === "2024" ? `<p class="education-copy" style="margin-top:6px">Completed ${escapeHtml(CV.coursera.date)} · ${escapeHtml(CV.coursera.signer)}.</p><a class="verify-link" href="${escapeHtml(CV.coursera.verify)}" target="_blank" rel="noopener noreferrer">VERIFY COURSERA CERTIFICATE <span aria-hidden="true">↗</span></a>` : ""}</li>`,
    )
    .join("");
  return shell(
    "Knowledge<br />in orbit",
    "EDUCATION / 04",
    "04",
    `<p class="panel-lead">Five milestones across information systems, system support and development, technical support and Java foundations.</p><ol class="education-list" aria-label="Education, training and certifications">${items}</ol>`,
    "2019 — 2025 · LEARN / BUILD / REPEAT",
  );
}

function renderContact() {
  return shell(
    "Make a<br />connection",
    "CONTACT / 05",
    "05",
    `<p class="panel-lead">The physical contact icons in the scene are live links. Select a phone or envelope to open the matching contact action.</p><div class="contact-grid"><a class="contact-link" href="tel:${escapeHtml(CV.phone.replaceAll("-", ""))}"><span class="contact-icon" aria-hidden="true">⌕</span><span><small>PHONE / TAP TO CALL</small><strong>${escapeHtml(CV.phone)}</strong></span></a><a class="contact-link" href="mailto:${escapeHtml(CV.email)}"><span class="contact-icon" aria-hidden="true">✉</span><span><small>EMAIL / OPEN MAIL</small><strong>${escapeHtml(CV.email)}</strong></span></a></div><p class="contact-note">${escapeHtml(CV.name)}<br />Technical support · printer hardware · Java programming</p>`,
    "AVAILABLE FOR IT SUPPORT / SYSTEMS DEVELOPMENT",
  );
}

const sectionRenderers = {
  overview: renderOverview,
  skills: renderSkills,
  raydian: renderRaydian,
  bemba: renderBemba,
  education: renderEducation,
  contact: renderContact,
};

function updateActiveNav(id) {
  document.querySelectorAll("[data-section].nav-link").forEach((button) => {
    const selected = button.dataset.section === id;
    button.classList.toggle("is-active", selected);
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const section = SECTIONS.find((item) => item.id === id) ?? SECTIONS[0];
  document.querySelector("#hud-index").textContent = section.n;
  document.querySelector("#hud-name").textContent = section.title;
}

function setSection(id, options = {}) {
  if (!sectionRenderers[id]) return;
  const previous = activeSection;
  activeSection = id;
  const panel = document.querySelector("#content-panel");
  const content = document.querySelector("#section-content");
  updateActiveNav(id);
  content.innerHTML = sectionRenderers[id]();
  bindSectionButtons();
  panel.scrollTop = 0;
  if (!options.noFocus && previous !== id) panel.focus({ preventScroll: true });
  const reveal = () => {
    gsap.fromTo(
      content.children,
      { opacity: 0, y: 14, rotateX: -2 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: motionEnabled ? 0.52 : 0,
        stagger: motionEnabled ? 0.055 : 0,
        ease: "power2.out",
        clearProps: "all",
      },
    );
  };
  reveal();
  focusStation(id);
}

function bindSectionButtons() {
  document
    .querySelectorAll("#section-content [data-section]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        setSection(button.dataset.section),
      );
    });
}

function focusStation(id) {
  const selected = stationGroups.get(id);
  if (!selected || !controls || !camera) return;
  const mobile = window.innerWidth <= 700;
  const sceneOffset = mobile ? 0 : 2.4;
  const target =
    id === "overview"
      ? new THREE.Vector3(mobile ? 0 : -1.6, 1.02, 0)
      : selected.position.clone().add(new THREE.Vector3(-sceneOffset, 1.2, 0));
  const desktopDistance = id === "overview" ? 13.2 : 12.4;
  const distance = mobile ? (id === "overview" ? 18 : 13) : desktopDistance;
  const nextCamera = new THREE.Vector3(
    target.x,
    target.y + (mobile ? 3.5 : 2.7),
    target.z + distance,
  );
  const duration = motionEnabled ? 1.5 : 0;
  gsap.to(camera.position, {
    x: nextCamera.x,
    y: nextCamera.y,
    z: nextCamera.z,
    duration,
    ease: "power3.inOut",
    onUpdate: () => controls.update(),
  });
  gsap.to(controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration,
    ease: "power3.inOut",
    onUpdate: () => controls.update(),
  });
  stationGroups.forEach((node, key) => {
    const scale =
      id === "overview"
        ? key === "overview"
          ? 1
          : 0.08
        : key === id
          ? 1.12
          : 0.11;
    gsap.to(node.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration: motionEnabled ? 0.8 : 0,
      ease: "power2.out",
    });
  });
  renderer?.domElement?.classList.toggle("is-zoomed", id !== "overview");
}

function animate() {
  frameId = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  controls?.update();
  if (motionEnabled) {
    sceneRoot.rotation.y = Math.sin(t * 0.035) * 0.018;
    for (const { fan, speed } of animatedFans)
      fan.rotation.z += delta * speed * 1.5;
  }
  renderer.render(scene, camera);
}

function onCanvasClick(event) {
  if (!renderer || !raycaster) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(sceneRoot.children, true);
  const hit = hits.find((entry) => {
    let node = entry.object;
    while (node && node !== sceneRoot) {
      if (node.userData?.section || node.userData?.href) return true;
      node = node.parent;
    }
    return false;
  });
  if (!hit) return;
  let node = hit.object;
  while (node && node !== sceneRoot) {
    if (node.userData?.href) {
      window.location.href = node.userData.href;
      return;
    }
    if (node.userData?.section) {
      setSection(node.userData.section);
      return;
    }
    node = node.parent;
  }
}

function onCanvasPointerMove(event) {
  if (!renderer || !raycaster) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(sceneRoot.children, true);
  const interactive = hits.some((entry) => {
    let node = entry.object;
    while (node && node !== sceneRoot) {
      if (node.userData?.section || node.userData?.href) return true;
      node = node.parent;
    }
    return false;
  });
  renderer.domElement.style.cursor = interactive ? "pointer" : "grab";
}

function renderResumeTape() {
  const facts = [
    CV.objective,
    ...CV.skills,
    ...CV.experience.flatMap((entry) => [
      entry.role,
      entry.company,
      entry.date,
      ...entry.duties,
    ]),
    ...CV.education.flatMap((entry) => [entry.year, entry.title, entry.issuer]),
    `${CV.coursera.date} · ${CV.coursera.signer} · ${CV.coursera.verify}`,
    CV.phone,
    CV.email,
  ];
  const run = `<span class="tape-copy">${facts.map((fact) => `<span>${escapeHtml(fact)}</span><i aria-hidden="true">✳</i>`).join("")}</span>`;
  document.querySelector("#resume-tape-track").innerHTML = `${run}${run}`;
}

function setMotion(enabled, sync = true) {
  motionEnabled = enabled;
  document.body.classList.toggle("motion-paused", !enabled);
  const button = document.querySelector("#motion-toggle");
  const label = document.querySelector("#motion-label");
  if (button) button.setAttribute("aria-pressed", String(enabled));
  if (label) label.textContent = enabled ? "MOTION ON" : "MOTION OFF";
  if (sync) {
    gsap.globalTimeline
      .getChildren(true, true, true)
      .forEach((tween) => tween.paused(!enabled));
    if (enabled) focusStation(activeSection);
  }
}

function bindUI() {
  document
    .querySelectorAll(".nav-link, .map-reset, .brand-lockup")
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        setSection(button.dataset.section || "overview");
      });
    });
  document
    .querySelector("#motion-toggle")
    .addEventListener("click", () => setMotion(!motionEnabled));
  document.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.matches('input, textarea, select, [contenteditable="true"]')
    )
      return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const current = SECTIONS.findIndex((item) => item.id === activeSection);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (current + direction + SECTIONS.length) % SECTIONS.length;
    setSection(SECTIONS[next].id);
  });
  window.addEventListener("resize", () => {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = window.innerWidth <= 700 ? 45 : 38;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth <= 700 ? 1.5 : 1.8,
      ),
    );
    focusStation(activeSection);
  });
  reducedPreference.addEventListener?.("change", (event) =>
    setMotion(!event.matches),
  );
}

function initialize() {
  renderResumeTape();
  bindUI();
  try {
    createScene();
  } catch (error) {
    console.error("The WebGL scene could not be initialized:", error);
    document.querySelector("#scene-fallback").hidden = false;
  }
  setSection("overview", { noFocus: true });
  if (!reducedPreference.matches) setMotion(true, false);
  else setMotion(false, true);
}

initialize();
window.setTimeout(
  () => document.querySelector("#boot-overlay")?.classList.add("is-hidden"),
  420,
);
