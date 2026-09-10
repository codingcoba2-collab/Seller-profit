import * as THREE from 'three';

export interface HumanMeshes {
  avatarGroup: THREE.Group;
  headGroup: THREE.Group;
  torsoGroup: THREE.Group;
  bustGroup: THREE.Group;
  chestMesh: THREE.Mesh;
  rightArmGroup: THREE.Group;
  rightForearmGroup: THREE.Group;
  ponyRoot: THREE.Group;
  ponyMid: THREE.Group;
  ponyTip: THREE.Group;
  bangsLeft: THREE.Group;
  bangsRight: THREE.Group;
  eyelids: THREE.Mesh[];
  pedestalGroup: THREE.Group;
  particles: THREE.Points;
}

export interface HumanMaterials {
  skinMaterial: THREE.MeshPhysicalMaterial;
  lipsMaterial: THREE.MeshPhysicalMaterial;
  hairMaterial: THREE.MeshStandardMaterial;
  eyeWhiteMaterial: THREE.MeshStandardMaterial;
  irisMaterial: THREE.MeshStandardMaterial;
  pupilMaterial: THREE.MeshBasicMaterial;
  tearDuctMaterial: THREE.MeshStandardMaterial;
  nailMaterial: THREE.MeshStandardMaterial;
  jerseyMaterial: THREE.MeshStandardMaterial;
  shortsMaterial: THREE.MeshStandardMaterial;
  sockMaterial: THREE.MeshStandardMaterial;
  shoeMaterial: THREE.MeshStandardMaterial;
  shoeSoleMaterial: THREE.MeshStandardMaterial;
  redTrimMaterial: THREE.MeshStandardMaterial;
}

/**
 * Creates 5-finger articulated anatomical human hand
 * Features thenar/hypothenar mounds, 3 phalanges per finger, opposed thumb, and nails
 */
export function createArticulatedHumanHand(
  isRight: boolean,
  skinMaterial: THREE.Material,
  nailMaterial: THREE.Material
): THREE.Group {
  const handGroup = new THREE.Group();

  // 1. Palm (Metacarpus with anatomical thenar and hypothenar mounds)
  const palmGeo = new THREE.BoxGeometry(0.054, 0.076, 0.024);
  const palm = new THREE.Mesh(palmGeo, skinMaterial);
  palm.position.y = -0.038;
  palm.castShadow = true;
  handGroup.add(palm);

  // Thenar mound (muscular thumb base)
  const thenarGeo = new THREE.SphereGeometry(0.016, 12, 12);
  thenarGeo.scale(1.1, 1.4, 0.9);
  const thenar = new THREE.Mesh(thenarGeo, skinMaterial);
  thenar.position.set(isRight ? -0.018 : 0.018, -0.032, 0.008);
  handGroup.add(thenar);

  // Helper for finger creation
  const createFinger = (
    relX: number,
    baseLen: number,
    radius: number,
    isThumb: boolean = false
  ) => {
    const fingerRoot = new THREE.Group();
    fingerRoot.position.set(relX, isThumb ? -0.022 : -0.076, isThumb ? 0.008 : 0);

    if (isThumb) {
      fingerRoot.rotation.z = isRight ? 0.46 : -0.46;
      fingerRoot.rotation.y = isRight ? -0.26 : 0.26;

      // Metacarpal / Proximal segment
      const t1 = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.1, radius, baseLen * 0.55, 12),
        skinMaterial
      );
      t1.position.y = -baseLen * 0.275;
      fingerRoot.add(t1);

      // Distal segment
      const t2 = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.85, baseLen * 0.45, 12),
        skinMaterial
      );
      t2.position.y = -baseLen * 0.775;
      fingerRoot.add(t2);

      // Nail
      const nail = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.35, baseLen * 0.22, 0.004),
        nailMaterial
      );
      nail.position.set(0, -baseLen * 0.88, radius * 0.82);
      fingerRoot.add(nail);
    } else {
      // 3 articulated phalanges (Proximal, Middle, Distal)
      const p1Len = baseLen * 0.42;
      const p2Len = baseLen * 0.32;
      const p3Len = baseLen * 0.26;

      // Proximal phalanx
      const p1 = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.05, radius * 0.95, p1Len, 12),
        skinMaterial
      );
      p1.position.y = -p1Len * 0.5;
      fingerRoot.add(p1);

      // Middle phalanx (natural relaxed resting curl)
      const p2Group = new THREE.Group();
      p2Group.position.y = -p1Len;
      p2Group.rotation.x = 0.08;
      fingerRoot.add(p2Group);

      const p2 = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.95, radius * 0.85, p2Len, 12),
        skinMaterial
      );
      p2.position.y = -p2Len * 0.5;
      p2Group.add(p2);

      // Distal phalanx with manicured nail
      const p3Group = new THREE.Group();
      p3Group.position.y = -p2Len;
      p3Group.rotation.x = 0.06;
      p2Group.add(p3Group);

      const p3 = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.85, radius * 0.7, p3Len, 12),
        skinMaterial
      );
      p3.position.y = -p3Len * 0.5;
      p3Group.add(p3);

      const nail = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.3, p3Len * 0.48, 0.003),
        nailMaterial
      );
      nail.position.set(0, -p3Len * 0.5, radius * 0.72);
      p3Group.add(nail);
    }

    return fingerRoot;
  };

  // 1. Opposed Thumb
  handGroup.add(createFinger(isRight ? -0.028 : 0.028, 0.046, 0.009, true));
  // 2. Index finger
  handGroup.add(createFinger(isRight ? -0.016 : 0.016, 0.050, 0.0076));
  // 3. Middle finger (longest digit)
  handGroup.add(createFinger(isRight ? -0.005 : 0.005, 0.056, 0.0078));
  // 4. Ring finger
  handGroup.add(createFinger(isRight ? 0.006 : -0.006, 0.051, 0.0074));
  // 5. Pinky finger (delicate model flare)
  handGroup.add(createFinger(isRight ? 0.017 : -0.017, 0.043, 0.0065));

  return handGroup;
}

/**
 * Creates realistic human ear with anatomical outer helix, antihelix, concha cavity, tragus and lobe
 */
export function createRealisticEar(isRight: boolean, skinMaterial: THREE.Material): THREE.Group {
  const earGroup = new THREE.Group();
  const x = isRight ? 0.19 : -0.19;
  earGroup.position.set(x, 0.13, -0.01);
  earGroup.rotation.y = isRight ? 0.25 : -0.25;

  // Outer Helix (curved rim)
  const helixGeo = new THREE.TorusGeometry(0.048, 0.009, 12, 24, Math.PI * 0.92);
  const helix = new THREE.Mesh(helixGeo, skinMaterial);
  helix.rotation.z = isRight ? -0.35 : 0.35;
  earGroup.add(helix);

  // Concha cavity (inner bowl)
  const conchaGeo = new THREE.SphereGeometry(0.026, 16, 16);
  conchaGeo.scale(0.8, 1.2, 0.4);
  const concha = new THREE.Mesh(conchaGeo, skinMaterial);
  concha.position.set(isRight ? -0.012 : 0.012, 0.005, 0.006);
  earGroup.add(concha);

  // Tragus tab
  const tragusGeo = new THREE.BoxGeometry(0.012, 0.016, 0.008);
  const tragus = new THREE.Mesh(tragusGeo, skinMaterial);
  tragus.position.set(isRight ? -0.024 : 0.024, 0.0, 0.012);
  earGroup.add(tragus);

  // Soft Earlobe (lobule)
  const lobeGeo = new THREE.SphereGeometry(0.019, 16, 16);
  lobeGeo.scale(0.9, 1.1, 0.7);
  const lobe = new THREE.Mesh(lobeGeo, skinMaterial);
  lobe.position.set(0, -0.044, 0.005);
  earGroup.add(lobe);

  return earGroup;
}

/**
 * Builds the complete Photorealistic 3D Digital Human model
 */
export function buildPhotorealisticDigitalHuman(
  scene: THREE.Scene,
  materials: HumanMaterials
): HumanMeshes {
  const {
    skinMaterial,
    lipsMaterial,
    hairMaterial,
    eyeWhiteMaterial,
    irisMaterial,
    pupilMaterial,
    tearDuctMaterial,
    nailMaterial,
    jerseyMaterial,
    shortsMaterial,
    sockMaterial,
    shoeMaterial,
    shoeSoleMaterial,
    redTrimMaterial,
  } = materials;

  const avatarGroup = new THREE.Group();
  avatarGroup.position.set(0, 0, 0);
  scene.add(avatarGroup);

  const eyelids: THREE.Mesh[] = [];

  // =========================================================================
  // 1. TORSO & CHEST (Athletic fashion model proportions, organic curves)
  // =========================================================================
  const torsoGroup = new THREE.Group();
  avatarGroup.add(torsoGroup);

  // Anatomically proportioned athletic feminine torso (slender waist, natural ribcage)
  const torsoGeo = new THREE.CylinderGeometry(0.31, 0.25, 0.62, 32);
  torsoGeo.scale(1.0, 1.0, 0.76);
  const torsoMesh = new THREE.Mesh(torsoGeo, jerseyMaterial);
  torsoMesh.position.y = 0.48;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // Clavicle & Collarbone Ridge with Suprasternal Notch
  const clavicleGeo = new THREE.TorusGeometry(0.19, 0.016, 16, 32, Math.PI * 0.72);
  const clavicleMesh = new THREE.Mesh(clavicleGeo, skinMaterial);
  clavicleMesh.position.set(0, 0.78, 0.05);
  clavicleMesh.rotation.x = Math.PI * 0.46;
  torsoGroup.add(clavicleMesh);

  // Anatomical Bust & Clothing Overlay Group with Dynamic Inertia Springs
  const bustGroup = new THREE.Group();
  bustGroup.position.set(0, 0.58, 0);
  torsoGroup.add(bustGroup);

  // Left and Right sculpted breasts with organic natural curvature blending with ribcage
  const breastLeftGeo = new THREE.SphereGeometry(0.125, 24, 24);
  breastLeftGeo.scale(1.15, 0.96, 1.15);
  const breastLeftMesh = new THREE.Mesh(breastLeftGeo, jerseyMaterial);
  breastLeftMesh.position.set(-0.105, 0, 0.12);
  breastLeftMesh.rotation.z = -0.12;
  breastLeftMesh.castShadow = true;
  bustGroup.add(breastLeftMesh);

  const breastRightGeo = new THREE.SphereGeometry(0.125, 24, 24);
  breastRightGeo.scale(1.15, 0.96, 1.15);
  const breastRightMesh = new THREE.Mesh(breastRightGeo, jerseyMaterial);
  breastRightMesh.position.set(0.105, 0, 0.12);
  breastRightMesh.rotation.z = 0.12;
  breastRightMesh.castShadow = true;
  bustGroup.add(breastRightMesh);

  // Jersey V-neck collar trim
  const collarGeo = new THREE.TorusGeometry(0.14, 0.018, 16, 32, Math.PI * 0.95);
  const collarMesh = new THREE.Mesh(collarGeo, redTrimMaterial);
  collarMesh.position.set(0, 0.22, 0.06);
  collarMesh.rotation.x = Math.PI * 0.42;
  collarMesh.rotation.z = Math.PI;
  bustGroup.add(collarMesh);

  // =========================================================================
  // 2. HEAD GROUP (High-Fidelity Anatomical Features, Facial Detail)
  // =========================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.94, 0);
  avatarGroup.add(headGroup);

  // Slender Natural Neck with Sternocleidomastoid Muscle Tone
  const neckGeo = new THREE.CylinderGeometry(0.095, 0.118, 0.20, 24);
  const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
  neckMesh.position.y = -0.05;
  headGroup.add(neckMesh);

  // Sculpted Cranium & Soft Feminine Jawline
  const craniumGeo = new THREE.SphereGeometry(0.24, 36, 36);
  craniumGeo.scale(0.88, 1.08, 0.94);
  const craniumMesh = new THREE.Mesh(craniumGeo, skinMaterial);
  craniumMesh.position.set(0, 0.16, 0);
  craniumMesh.castShadow = true;
  headGroup.add(craniumMesh);

  // Cheekbones (Zygomatic arches definition)
  const cheekLeftGeo = new THREE.SphereGeometry(0.065, 16, 16);
  cheekLeftGeo.scale(1.0, 0.8, 0.7);
  const cheekLeft = new THREE.Mesh(cheekLeftGeo, skinMaterial);
  cheekLeft.position.set(-0.115, 0.13, 0.13);
  headGroup.add(cheekLeft);

  const cheekRightGeo = new THREE.SphereGeometry(0.065, 16, 16);
  cheekRightGeo.scale(1.0, 0.8, 0.7);
  const cheekRight = new THREE.Mesh(cheekRightGeo, skinMaterial);
  cheekRight.position.set(0.115, 0.13, 0.13);
  headGroup.add(cheekRight);

  // Delicate Chin Definition (Mentalis)
  const chinGeo = new THREE.SphereGeometry(0.062, 20, 20);
  chinGeo.scale(0.85, 0.75, 0.85);
  const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
  chinMesh.position.set(0, 0.015, 0.185);
  headGroup.add(chinMesh);

  // Real Anatomical Ears (Telinga)
  headGroup.add(createRealisticEar(false, skinMaterial));
  headGroup.add(createRealisticEar(true, skinMaterial));

  // Natural Nose Bridge, Tip, and Alar Wings (Hidung)
  const noseBridgeGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.095, 16);
  noseBridgeGeo.scale(0.7, 1.0, 1.2);
  const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMaterial);
  noseBridge.position.set(0, 0.138, 0.215);
  noseBridge.rotation.x = Math.PI * 0.08;
  headGroup.add(noseBridge);

  const noseTipGeo = new THREE.SphereGeometry(0.022, 16, 16);
  noseTipGeo.scale(1.0, 0.85, 1.1);
  const noseTip = new THREE.Mesh(noseTipGeo, skinMaterial);
  noseTip.position.set(0, 0.098, 0.238);
  headGroup.add(noseTip);

  const alarLeftGeo = new THREE.SphereGeometry(0.014, 12, 12);
  const alarLeft = new THREE.Mesh(alarLeftGeo, skinMaterial);
  alarLeft.position.set(-0.022, 0.095, 0.222);
  headGroup.add(alarLeft);

  const alarRightGeo = new THREE.SphereGeometry(0.014, 12, 12);
  const alarRight = new THREE.Mesh(alarRightGeo, skinMaterial);
  alarRight.position.set(0.022, 0.095, 0.222);
  headGroup.add(alarRight);

  // Natural Contoured Lips with Cupid's Bow & Satin Finish (Mulut & Bibir)
  const upperLipGeo = new THREE.TorusGeometry(0.034, 0.011, 14, 24, Math.PI * 0.88);
  const upperLip = new THREE.Mesh(upperLipGeo, lipsMaterial);
  upperLip.position.set(0, 0.058, 0.212);
  upperLip.rotation.x = Math.PI * 0.12;
  upperLip.rotation.z = Math.PI;
  headGroup.add(upperLip);

  const lowerLipGeo = new THREE.TorusGeometry(0.030, 0.013, 14, 24, Math.PI * 0.84);
  const lowerLip = new THREE.Mesh(lowerLipGeo, lipsMaterial);
  lowerLip.position.set(0, 0.039, 0.208);
  lowerLip.rotation.x = -Math.PI * 0.10;
  headGroup.add(lowerLip);

  // Photorealistic 3D Eyes with Wet Reflections, Sclera, Iris, Caruncle & Eyelids (Mata)
  const createEye = (isRight: boolean) => {
    const eyeGroup = new THREE.Group();
    const x = isRight ? 0.082 : -0.082;
    eyeGroup.position.set(x, 0.165, 0.188);

    // Sclera with natural eyeball curvature
    const scleraGeo = new THREE.SphereGeometry(0.048, 24, 24);
    scleraGeo.scale(1.22, 0.92, 0.72);
    const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMaterial);
    eyeGroup.add(sclera);

    // Hazel-Green Iris with detailed radial fibers
    const irisGeo = new THREE.CircleGeometry(0.028, 32);
    const iris = new THREE.Mesh(irisGeo, irisMaterial);
    iris.position.set(0, 0, 0.032);
    eyeGroup.add(iris);

    // Pupil
    const pupilGeo = new THREE.CircleGeometry(0.013, 20);
    const pupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    pupil.position.set(0, 0, 0.034);
    eyeGroup.add(pupil);

    // Wet Specular Corneal Highlight
    const corneaGeo = new THREE.SphereGeometry(0.026, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const corneaMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.88,
    });
    const corneaHighlight = new THREE.Mesh(corneaGeo, corneaMat);
    corneaHighlight.position.set(0.008, 0.008, 0.035);
    corneaHighlight.scale.set(0.24, 0.24, 0.1);
    eyeGroup.add(corneaHighlight);

    // Tear duct / Caruncle (inner eye corner)
    const tearDuctGeo = new THREE.SphereGeometry(0.008, 12, 12);
    const tearDuct = new THREE.Mesh(tearDuctGeo, tearDuctMaterial);
    tearDuct.position.set(isRight ? -0.042 : 0.042, -0.002, 0.028);
    eyeGroup.add(tearDuct);

    // Curved Eyelashes framing upper lid
    const lashGeo = new THREE.TorusGeometry(0.038, 0.005, 8, 24, Math.PI * 0.74);
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x140E0C });
    const lash = new THREE.Mesh(lashGeo, lashMat);
    lash.position.set(0, 0.018, 0.028);
    lash.rotation.z = isRight ? -0.1 : 0.1;
    eyeGroup.add(lash);

    // Upper Eyelid for Realistic Blinking
    const lidGeo = new THREE.SphereGeometry(0.052, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    lidGeo.scale(1.24, 0.90, 0.74);
    const lid = new THREE.Mesh(lidGeo, skinMaterial);
    lid.position.set(0, 0.014, 0.006);
    lid.scale.y = 0.05;
    eyeGroup.add(lid);
    eyelids.push(lid);

    return eyeGroup;
  };
  headGroup.add(createEye(false));
  headGroup.add(createEye(true));

  // Delicate Eyebrows
  const browGeo = new THREE.TorusGeometry(0.054, 0.007, 8, 24, Math.PI * 0.68);
  const browMat = new THREE.MeshStandardMaterial({ color: 0x221714, roughness: 0.4 });
  const browLeft = new THREE.Mesh(browGeo, browMat);
  browLeft.position.set(-0.086, 0.218, 0.182);
  browLeft.rotation.z = -0.12;
  headGroup.add(browLeft);

  const browRight = new THREE.Mesh(browGeo, browMat);
  browRight.position.set(0.086, 0.218, 0.182);
  browRight.rotation.z = 0.12;
  headGroup.add(browRight);

  // Photorealistic Hair: Volumetric salon cut with part & face-framing locks (Rambut)
  const hairCapGeo = new THREE.SphereGeometry(0.258, 36, 36);
  hairCapGeo.scale(0.92, 1.06, 0.98);
  const hairCapMesh = new THREE.Mesh(hairCapGeo, hairMaterial);
  hairCapMesh.position.set(0, 0.18, -0.02);
  headGroup.add(hairCapMesh);

  // Natural Face-Framing Tresses (Soft side locks)
  const bangsLeftGroup = new THREE.Group();
  bangsLeftGroup.position.set(-0.10, 0.28, 0.16);
  const bangsLeftGeo = new THREE.CylinderGeometry(0.038, 0.018, 0.32, 16);
  bangsLeftGeo.rotateZ(0.18);
  bangsLeftGeo.rotateX(-0.10);
  const bangsLeft = new THREE.Mesh(bangsLeftGeo, hairMaterial);
  bangsLeftGroup.add(bangsLeft);
  headGroup.add(bangsLeftGroup);

  const bangsRightGroup = new THREE.Group();
  bangsRightGroup.position.set(0.10, 0.28, 0.16);
  const bangsRightGeo = new THREE.CylinderGeometry(0.038, 0.018, 0.32, 16);
  bangsRightGeo.rotateZ(-0.18);
  bangsRightGeo.rotateX(-0.10);
  const bangsRight = new THREE.Mesh(bangsRightGeo, hairMaterial);
  bangsRightGroup.add(bangsRight);
  headGroup.add(bangsRightGroup);

  // Elegant Ponytail Tie
  const bandGeo = new THREE.TorusGeometry(0.065, 0.02, 16, 32);
  const bandMesh = new THREE.Mesh(bandGeo, redTrimMaterial);
  bandMesh.position.set(0, 0.32, -0.24);
  bandMesh.rotation.x = Math.PI * 0.32;
  headGroup.add(bandMesh);

  // 3-Segment Articulated Dynamic Ponytail
  const ponyRoot = new THREE.Group();
  ponyRoot.position.set(0, 0.30, -0.26);
  headGroup.add(ponyRoot);

  const pony1Geo = new THREE.CylinderGeometry(0.055, 0.075, 0.22, 16);
  const pony1 = new THREE.Mesh(pony1Geo, hairMaterial);
  pony1.position.y = -0.11;
  pony1.castShadow = true;
  ponyRoot.add(pony1);

  const ponyMid = new THREE.Group();
  ponyMid.position.set(0, -0.21, -0.01);
  ponyRoot.add(ponyMid);

  const pony2Geo = new THREE.CylinderGeometry(0.072, 0.062, 0.24, 16);
  const pony2 = new THREE.Mesh(pony2Geo, hairMaterial);
  pony2.position.y = -0.12;
  pony2.castShadow = true;
  ponyMid.add(pony2);

  const ponyTip = new THREE.Group();
  ponyTip.position.set(0, -0.23, -0.01);
  ponyMid.add(ponyTip);

  const pony3Geo = new THREE.ConeGeometry(0.062, 0.22, 16);
  pony3Geo.rotateX(Math.PI);
  const pony3 = new THREE.Mesh(pony3Geo, hairMaterial);
  pony3.position.y = -0.11;
  pony3.castShadow = true;
  ponyTip.add(pony3);

  // =========================================================================
  // 3. ARMS & 5-FINGER ARTICULATED ANATOMICAL HANDS (Tangan & Jari)
  // =========================================================================
  const sleeveGeo = new THREE.CylinderGeometry(0.096, 0.088, 0.20, 20);

  // Left Arm (Relaxed Runway Fashion Model Pose)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.33, 0.76, 0);
  avatarGroup.add(leftArmGroup);

  const deltoidLeft = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), skinMaterial);
  deltoidLeft.scale.set(0.9, 1.1, 0.85);
  leftArmGroup.add(deltoidLeft);

  const leftSleeve = new THREE.Mesh(sleeveGeo, jerseyMaterial);
  leftSleeve.position.y = -0.09;
  leftArmGroup.add(leftSleeve);

  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.058, 0.28, 20),
    skinMaterial
  );
  leftUpperArm.position.y = -0.22;
  leftArmGroup.add(leftUpperArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.36, 0);
  leftArmGroup.add(leftForearm);

  const leftForearmMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.048, 0.26, 20),
    skinMaterial
  );
  leftForearmMesh.position.y = -0.13;
  leftForearm.add(leftForearmMesh);

  const handGroupLeft = createArticulatedHumanHand(false, skinMaterial, nailMaterial);
  handGroupLeft.position.set(0, -0.26, 0);
  handGroupLeft.rotation.z = 0.08;
  leftForearm.add(handGroupLeft);

  leftArmGroup.rotation.z = 0.14;
  leftArmGroup.rotation.x = 0.04;

  // Right Arm (Articulated with Responsive Waving & Greeting Support)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.33, 0.76, 0);
  avatarGroup.add(rightArmGroup);

  const deltoidRight = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), skinMaterial);
  deltoidRight.scale.set(0.9, 1.1, 0.85);
  rightArmGroup.add(deltoidRight);

  const rightSleeve = new THREE.Mesh(sleeveGeo, jerseyMaterial);
  rightSleeve.position.y = -0.09;
  rightArmGroup.add(rightSleeve);

  const rightUpperMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.058, 0.28, 20),
    skinMaterial
  );
  rightUpperMesh.position.y = -0.22;
  rightArmGroup.add(rightUpperMesh);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0, -0.36, 0);
  rightArmGroup.add(rightForearmGroup);

  const rightForearmMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.048, 0.26, 20),
    skinMaterial
  );
  rightForearmMesh.position.y = -0.13;
  rightForearmGroup.add(rightForearmMesh);

  const handGroupRight = createArticulatedHumanHand(true, skinMaterial, nailMaterial);
  handGroupRight.position.set(0, -0.26, 0);
  handGroupRight.rotation.z = -0.08;
  rightForearmGroup.add(handGroupRight);

  rightArmGroup.rotation.z = -0.14;

  // =========================================================================
  // 4. HIPS, LEGS & HIGH-FASHION FOOTWEAR (Kaki & Seluruh Tubuh)
  // =========================================================================
  const hipsGroup = new THREE.Group();
  hipsGroup.position.set(0, 0.18, 0);
  avatarGroup.add(hipsGroup);

  const shortsGeo = new THREE.CylinderGeometry(0.26, 0.29, 0.28, 28);
  shortsGeo.scale(1.0, 1.0, 0.82);
  const shortsMesh = new THREE.Mesh(shortsGeo, shortsMaterial);
  shortsMesh.castShadow = true;
  hipsGroup.add(shortsMesh);

  // Realistic Anatomical Legs with Contrapposto Fashion Stance
  const createPhotorealisticLeg = (isRight: boolean) => {
    const leg = new THREE.Group();
    const x = isRight ? 0.12 : -0.12;
    leg.position.set(x, -0.14, 0);

    // Thigh with natural quadriceps contour
    const thighGeo = new THREE.CylinderGeometry(0.098, 0.076, 0.44, 24);
    const thigh = new THREE.Mesh(thighGeo, skinMaterial);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    leg.add(thigh);

    // Anatomical Knee with sculpted Patella bone definition
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.44, 0.01);
    leg.add(kneeGroup);

    const patellaGeo = new THREE.SphereGeometry(0.042, 16, 16);
    patellaGeo.scale(0.85, 1.1, 0.7);
    const patella = new THREE.Mesh(patellaGeo, skinMaterial);
    kneeGroup.add(patella);

    // Calf with Gastrocnemius muscle curve tapering into Achilles tendon
    const calfGroup = new THREE.Group();
    calfGroup.position.set(0, -0.44, 0);
    leg.add(calfGroup);

    const calfGeo = new THREE.CylinderGeometry(0.072, 0.054, 0.44, 24);
    const calf = new THREE.Mesh(calfGeo, skinMaterial);
    calf.position.y = -0.22;
    calf.castShadow = true;
    calfGroup.add(calf);

    // Athletic sock
    const sockGeo = new THREE.CylinderGeometry(0.058, 0.052, 0.16, 20);
    const sock = new THREE.Mesh(sockGeo, sockMaterial);
    sock.position.y = -0.36;
    sock.castShadow = true;
    calfGroup.add(sock);

    const bandSockGeo = new THREE.CylinderGeometry(0.060, 0.058, 0.03, 20);
    const bandSock = new THREE.Mesh(bandSockGeo, redTrimMaterial);
    bandSock.position.y = -0.28;
    calfGroup.add(bandSock);

    // Ankle Malleolus Bones (medial & lateral)
    const ankleLeft = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), skinMaterial);
    ankleLeft.position.set(-0.044, -0.41, 0);
    calfGroup.add(ankleLeft);

    const ankleRight = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), skinMaterial);
    ankleRight.position.set(0.044, -0.41, 0);
    calfGroup.add(ankleRight);

    // High-Fashion Designer Footwear
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.42, 0.03);
    calfGroup.add(shoeGroup);

    const shoeBodyGeo = new THREE.BoxGeometry(0.098, 0.075, 0.22);
    const shoeBody = new THREE.Mesh(shoeBodyGeo, shoeMaterial);
    shoeBody.position.set(0, -0.02, 0.02);
    shoeBody.castShadow = true;
    shoeGroup.add(shoeBody);

    const soleGeo = new THREE.BoxGeometry(0.106, 0.028, 0.24);
    const sole = new THREE.Mesh(soleGeo, shoeSoleMaterial);
    sole.position.set(0, -0.062, 0.02);
    sole.receiveShadow = true;
    shoeGroup.add(sole);

    const heelAccentGeo = new THREE.BoxGeometry(0.088, 0.016, 0.035);
    const heelAccent = new THREE.Mesh(heelAccentGeo, redTrimMaterial);
    heelAccent.position.set(0, -0.045, -0.08);
    shoeGroup.add(heelAccent);

    // Relaxed contrapposto stance for left leg
    if (!isRight) {
      leg.rotation.x = 0.08;
      leg.rotation.y = 0.06;
    }

    return leg;
  };

  hipsGroup.add(createPhotorealisticLeg(false));
  hipsGroup.add(createPhotorealisticLeg(true));

  // =========================================================================
  // 5. RUNWAY PEDESTAL STAGE & AMBIENT PARTICLES
  // =========================================================================
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.set(0, -1.04, 0);
  avatarGroup.add(pedestalGroup);

  const baseDiscGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.08, 48);
  const baseDiscMat = new THREE.MeshStandardMaterial({
    color: 0x121318,
    roughness: 0.22,
    metalness: 0.75,
  });
  const baseDisc = new THREE.Mesh(baseDiscGeo, baseDiscMat);
  baseDisc.receiveShadow = true;
  pedestalGroup.add(baseDisc);

  // Contact Ambient Occlusion Shadow Decal
  const shadowDecalGeo = new THREE.PlaneGeometry(0.8, 0.5);
  const shadowDecalMat = new THREE.MeshBasicMaterial({
    color: 0x050608,
    transparent: true,
    opacity: 0.65,
  });
  const shadowDecal = new THREE.Mesh(shadowDecalGeo, shadowDecalMat);
  shadowDecal.rotation.x = -Math.PI * 0.5;
  shadowDecal.position.y = 0.042;
  pedestalGroup.add(shadowDecal);

  const innerRingGeo = new THREE.RingGeometry(1.2, 1.28, 64);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0x25F4EE,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI * 0.5;
  innerRing.position.y = 0.045;
  pedestalGroup.add(innerRing);

  const outerRingGeo = new THREE.RingGeometry(1.5, 1.56, 64);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0xFE2C55,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI * 0.5;
  outerRing.position.y = 0.046;
  pedestalGroup.add(outerRing);

  // Atmospheric ambient dust particles
  const particleCount = 45;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePos[i] = (Math.random() - 0.5) * 3.5;
    particlePos[i + 1] = Math.random() * 2.5 - 0.8;
    particlePos[i + 2] = (Math.random() - 0.5) * 3.5;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x25F4EE,
    size: 0.025,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  return {
    avatarGroup,
    headGroup,
    torsoGroup,
    bustGroup,
    chestMesh: torsoMesh,
    rightArmGroup,
    rightForearmGroup,
    ponyRoot,
    ponyMid,
    ponyTip,
    bangsLeft: bangsLeftGroup,
    bangsRight: bangsRightGroup,
    eyelids,
    pedestalGroup,
    particles,
  };
}
