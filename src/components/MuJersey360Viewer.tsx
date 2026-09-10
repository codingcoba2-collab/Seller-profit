import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  Hand, 
  Compass, 
  Upload, 
  RotateCcw, 
  Check, 
  X, 
  Shirt, 
  Sparkle,
  Play,
  Pause,
  Layers,
  Info,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Box
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import { ProcessingService } from '../services/processingService';
import { MeshyModelStorage } from '../services/meshyModelStorage';
import { inspect3DBuffer } from '../utils/modelValidation';
import { MeshyModelModal } from './MeshyModelModal';
import { AvatarCustomizerModal } from './AvatarCustomizerModal';
import { 
  AvatarStudioConfig, 
  AvatarSettingsService 
} from '../services/avatarSettingsService';
import { 
  OutfitConfig, 
  TouchRipple, 
  BASE_COLOR_OPTIONS, 
  AVATAR_RESPONSES,
  PresetOutfit 
} from './avatar3d/types';
import {
  createPhotorealisticSkinTexture,
  createPhotorealisticSkinBumpMap,
  createPhotorealisticEyeTexture,
  createPhotorealisticHairTexture,
  generateOutfitTexture,
  generateShortsTexture,
} from './avatar3d/humanTextures';
import {
  buildPhotorealisticDigitalHuman,
  HumanMaterials,
} from './avatar3d/humanGeometries';

// Photorealistic 3D Scanned Digital Human Assets (Sophia x Manchester United 2024/2025)
import sophiaFront from '../assets/images/sophia_mu_front_1789019777467.jpg';
import sophiaSide from '../assets/images/sophia_mu_side_1789019791056.jpg';
import sophiaBack from '../assets/images/sophia_mu_back_1789019806676.jpg';
import sophiaLeft from '../assets/images/sophia_mu_left_1789019840503.jpg';
import sophiaReact from '../assets/images/sophia_mu_react_1789019824492.jpg';

interface MuJersey360ViewerProps {
  onOpenLoginModal: () => void;
}

const STORAGE_KEY = 'seller_profit_3d_outfit_v4';

interface JerseyHotspot {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  xPercent: number;
  yPercent: number;
  visibleAngles: [number, number]; // [minAngle, maxAngle]
}

const JERSEY_HOTSPOTS: JerseyHotspot[] = [
  {
    id: 'mu-crest',
    title: 'Lambang Klub Manchester United',
    subtitle: 'Bordir Resmi Presisi Tinggi',
    description: 'Logo otentik klub berjuluk Setan Merah dengan rajutan benang emas, merah, dan hitam tahan cuci.',
    xPercent: 54,
    yPercent: 32,
    visibleAngles: [315, 65], // Visible from front
  },
  {
    id: 'sponsor-snapdragon',
    title: 'Sponsor Utama Snapdragon®',
    subtitle: 'Teknologi Heat-Pressed 3D Silicon',
    description: 'Logo Snapdragon resmi musim 2024/2025 bertekstur matte anti retak dengan ketahanan gesek prima.',
    xPercent: 50,
    yPercent: 38,
    visibleAngles: [330, 45],
  },
  {
    id: 'collar-trim',
    title: 'Kerah V-Neck & Lis Putih Ikonik',
    subtitle: 'Desain Klasik Terinspirasi Old Trafford',
    description: 'Potongan kerah ergonomis fleksibel dengan rajutan benang elastis ganda yang nyaman di kulit.',
    xPercent: 50,
    yPercent: 27,
    visibleAngles: [300, 70],
  },
  {
    id: 'back-print',
    title: 'Panel Belakang Jersey',
    subtitle: 'Sirkulasi Udara Ventilasi Mikro',
    description: 'Panel kain mikro berpori khusus dengan cetakan nomor punggung dan nama pemain resmi.',
    xPercent: 50,
    yPercent: 33,
    visibleAngles: [120, 240], // Visible from back
  },
];

const OUTFIT_PRESETS: PresetOutfit[] = [
  {
    id: 'mu-home',
    name: 'Jersey MU Home 24/25',
    mode: 'jersey',
    baseColor: '#C70101',
    accentColor: '#FFFFFF',
    tag: 'Home Resmi',
  },
  {
    id: 'mu-away',
    name: 'Jersey MU Away Midnight',
    mode: 'jersey',
    baseColor: '#101426',
    accentColor: '#4FA3E3',
    tag: 'Away Resmi',
  },
  {
    id: 'mu-third',
    name: 'Jersey MU Third Retro',
    mode: 'jersey',
    baseColor: '#F5F5F0',
    accentColor: '#C70101',
    tag: 'Third Klasik',
  },
  {
    id: 'mu-treble',
    name: 'Jersey MU 1999 Treble',
    mode: 'jersey',
    baseColor: '#960000',
    accentColor: '#FFD700',
    tag: 'Vintage 99',
  },
];

export const MuJersey360Viewer: React.FC<MuJersey360ViewerProps> = ({ onOpenLoginModal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar Character Development Studio (Cloud Synced across all mobile devices)
  const [avatarStudioConfig, setAvatarStudioConfig] = useState<AvatarStudioConfig>(() =>
    AvatarSettingsService.getConfig()
  );
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);

  // Engine Mode: 'scan' (Photorealistic 3D Scan) vs 'webgl' (Procedural Canvas) vs 'meshy' (Meshy AI GLB Model)
  const [engineMode, setEngineMode] = useState<'scan' | 'webgl' | 'meshy'>(() => {
    return AvatarSettingsService.getConfig().engineMode || 'meshy';
  });

  // Meshy AI GLB 3D Model States
  const [activeMeshyModelName, setActiveMeshyModelName] = useState<string | null>(null);
  const [activeMeshyModelSize, setActiveMeshyModelSize] = useState<number | null>(null);
  const [isMeshyModalOpen, setIsMeshyModalOpen] = useState(false);
  const [meshyScale, setMeshyScale] = useState(() => AvatarSettingsService.getConfig().scale ?? 1.0);
  const [meshyOffsetY, setMeshyOffsetY] = useState(() => AvatarSettingsService.getConfig().offsetY ?? 0.0);
  const [isMeshyLoading, setIsMeshyLoading] = useState(false);

  // References for Meshy AI Model & Animations
  const meshyGroupRef = useRef<THREE.Group | null>(null);
  const meshyMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const baseFitScaleRef = useRef<number>(1.0);
  const meshyClockRef = useRef<THREE.Clock>(new THREE.Clock());

  // 360 Rotation & Motion States
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<JerseyHotspot | null>(null);

  // Tilt 3D Parallax Reference (Decoupled from React renders for ultra-smooth 60-120 FPS)
  const tiltRef = useRef({ x: 0, y: 0 });

  // Synced refs for animation loop
  const engineModeRef = useRef(engineMode);
  const meshyScaleRef = useRef(meshyScale);
  const meshyOffsetYRef = useRef(meshyOffsetY);
  const avatarStudioConfigRef = useRef(avatarStudioConfig);
  const lastDegReportTime = useRef(0);
  const lastReportedDeg = useRef(0);

  // Sync state to refs immediately
  useEffect(() => { engineModeRef.current = engineMode; }, [engineMode]);
  useEffect(() => { meshyScaleRef.current = meshyScale; }, [meshyScale]);
  useEffect(() => { meshyOffsetYRef.current = meshyOffsetY; }, [meshyOffsetY]);
  useEffect(() => { avatarStudioConfigRef.current = avatarStudioConfig; }, [avatarStudioConfig]);

  // Touch & Reaction State
  const [isReacting, setIsReacting] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [touchCount, setTouchCount] = useState(0);
  const [ripples, setRipples] = useState<TouchRipple[]>([]);

  // Outfit Customization State
  const [isOutfitDrawerOpen, setIsOutfitDrawerOpen] = useState(false);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [activeOutfit, setActiveOutfit] = useState<OutfitConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      type: 'default-mu',
      name: 'Jersey Manchester United 24/25',
      mode: 'jersey',
      baseColor: '#C70101',
      accentColor: '#FFFFFF',
    };
  });

  const [customImageElement, setCustomImageElement] = useState<HTMLImageElement | null>(null);

  // Physics & Momentum References
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const currentRotationRef = useRef(0);
  const lastSoundTickDeg = useRef(0);
  const reactTimeoutRef = useRef<any>(null);
  const autoSpinAnimIdRef = useRef<number | null>(null);

  // Three.js References for WebGL mode
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const skinMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const hairMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const irisMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const jerseyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const shortsMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const redTrimMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const lastPointerMoveTimeRef = useRef<number>(0);
  const isAutoSpinRef = useRef<boolean>(isAutoSpin);
  isAutoSpinRef.current = isAutoSpin;

  // =========================================================================
  // 1. ANGLE-BASED IMAGE CROSS-FADING LOGIC (0° to 360°)
  // =========================================================================
  // Cardinal views:
  // 0° (or 360°) = Front (sophiaFront)
  // 90° = Right Side (sophiaSide)
  // 180° = Back (sophiaBack)
  // 270° = Left Side (sophiaLeft)
  const angleWeights = useMemo(() => {
    const deg = ((rotationDeg % 360) + 360) % 360;

    let frontWeight = 0;
    let sideWeight = 0;
    let backWeight = 0;
    let leftWeight = 0;

    if (deg >= 0 && deg < 90) {
      const t = deg / 90;
      frontWeight = Math.cos((t * Math.PI) / 2);
      sideWeight = Math.sin((t * Math.PI) / 2);
    } else if (deg >= 90 && deg < 180) {
      const t = (deg - 90) / 90;
      sideWeight = Math.cos((t * Math.PI) / 2);
      backWeight = Math.sin((t * Math.PI) / 2);
    } else if (deg >= 180 && deg < 270) {
      const t = (deg - 180) / 90;
      backWeight = Math.cos((t * Math.PI) / 2);
      leftWeight = Math.sin((t * Math.PI) / 2);
    } else {
      const t = (deg - 270) / 90;
      leftWeight = Math.cos((t * Math.PI) / 2);
      frontWeight = Math.sin((t * Math.PI) / 2);
    }

    return {
      front: Math.max(0, Math.min(1, frontWeight)),
      side: Math.max(0, Math.min(1, sideWeight)),
      back: Math.max(0, Math.min(1, backWeight)),
      left: Math.max(0, Math.min(1, leftWeight)),
    };
  }, [rotationDeg]);

  // Cardinal orientation text helper
  const cardinalText = useMemo(() => {
    const deg = ((rotationDeg % 360) + 360) % 360;
    if (deg >= 337.5 || deg < 22.5) return 'Tampak Depan (0°)';
    if (deg >= 22.5 && deg < 67.5) return 'Serong Kanan (45°)';
    if (deg >= 67.5 && deg < 112.5) return 'Profil Kanan (90°)';
    if (deg >= 112.5 && deg < 157.5) return 'Serong Belakang Kanan (135°)';
    if (deg >= 157.5 && deg < 202.5) return 'Tampak Belakang (180°)';
    if (deg >= 202.5 && deg < 247.5) return 'Serong Belakang Kiri (225°)';
    if (deg >= 247.5 && deg < 292.5) return 'Profil Kiri (270°)';
    return 'Serong Depan Kiri (315°)';
  }, [rotationDeg]);

  // Check if a hotspot is currently visible based on rotation angle
  const isHotspotVisible = useCallback((spot: JerseyHotspot) => {
    const deg = ((rotationDeg % 360) + 360) % 360;
    const [min, max] = spot.visibleAngles;
    if (min > max) {
      // wraps around 0/360
      return deg >= min || deg <= max;
    }
    return deg >= min && deg <= max;
  }, [rotationDeg]);

  // =========================================================================
  // 2. 360° MOMENTUM PHYSICS & ROTATION ENGINE
  // =========================================================================
  useEffect(() => {
    let animId: number;

    const updatePhysics = () => {
      if (isAutoSpin) {
        currentRotationRef.current += 0.007;
      } else if (!isDraggingRef.current) {
        currentRotationRef.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.935; // smooth momentum friction

        if (Math.abs(angularVelocityRef.current) < 0.0001) {
          angularVelocityRef.current = 0;
        }
      }

      const deg = Math.round(((-currentRotationRef.current * (180 / Math.PI)) % 360 + 360) % 360);
      
      // Update React state at 30fps during inertia/auto-spin for silky image cross-fade
      const now = performance.now();
      if (!isDraggingRef.current && (now - lastDegReportTime.current > 33) && Math.abs(deg - lastReportedDeg.current) >= 1) {
        lastDegReportTime.current = now;
        lastReportedDeg.current = deg;
        setRotationDeg(deg);
      }

      // Play subtle tick sound on every 25 degrees
      if (Math.abs(deg - lastSoundTickDeg.current) >= 25) {
        lastSoundTickDeg.current = deg;
        SoundFx.playJerseyRotateTick();
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [isAutoSpin]);

  // Pointer & Drag Handlers
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    prevPointerXRef.current = clientX;
    lastPointerMoveTimeRef.current = performance.now();
    angularVelocityRef.current = 0;
    setShowSwipeHint(false);
    if (isAutoSpin) setIsAutoSpin(false);
  };

  const handlePointerMove = useCallback((clientX: number, clientY?: number) => {
    if (isDraggingRef.current) {
      const deltaX = clientX - prevPointerXRef.current;
      prevPointerXRef.current = clientX;
      lastPointerMoveTimeRef.current = performance.now();

      const rotationDelta = deltaX * 0.0075;
      currentRotationRef.current += rotationDelta;
      angularVelocityRef.current = rotationDelta;

      // Immediate rotationDeg update while dragging gives instantaneous 60fps tracking
      const deg = Math.round(((-currentRotationRef.current * (180 / Math.PI)) % 360 + 360) % 360);
      if (Math.abs(deg - lastReportedDeg.current) >= 1) {
        lastReportedDeg.current = deg;
        setRotationDeg(deg);
      }
    }

    // Parallax Tilt calculation directly into mutable ref (Zero React Re-render)
    if (stageRef.current && clientY !== undefined) {
      const rect = stageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const tiltY = ((clientX - centerX) / (rect.width / 2)) * 5; // max 5 deg
      const tiltX = -((clientY - centerY) / (rect.height / 2)) * 3.5; // max 3.5 deg
      tiltRef.current = { x: tiltX, y: tiltY };
    }
  }, []);

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    // If finger held still before releasing (>50ms), cancel momentum so it doesn't jerk
    if (performance.now() - lastPointerMoveTimeRef.current > 50) {
      angularVelocityRef.current = 0;
    }
    const finalDeg = Math.round(((-currentRotationRef.current * (180 / Math.PI)) % 360 + 360) % 360);
    setRotationDeg(finalDeg);
  };

  // =========================================================================
  // 3. INTERACTIVE TOUCH & REACTION (SOPHIA INTERACTION)
  // =========================================================================
  const handleStageClick = (e: React.MouseEvent | React.TouchEvent) => {
    SoundFx.unlockAudio();
    SoundFx.playSkinTouchSound();
    SoundFx.playAvatarTouchReaction();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const rippleColors = ['#FFA88C', '#25F4EE', '#FE2C55', '#FFD700'];
      const newRipple: TouchRipple = {
        id: Date.now() + Math.random(),
        x,
        y,
        color: rippleColors[Math.floor(Math.random() * rippleColors.length)],
      };
      setRipples(prev => [...prev.slice(-4), newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 950);
    }

    setIsReacting(true);
    setTouchCount(prev => prev + 1);

    const randomMsg = AVATAR_RESPONSES[touchCount % AVATAR_RESPONSES.length];
    setResponseText(randomMsg);

    // Dynamic speech response
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const speechLines = [
          "Glory Glory Manchester United! Selamat datang di Seller Profit! Siap melipatgandakan omset tokomu?",
          "Jersey Manchester United 24 25 ini dirancang dengan presisi 3D tingkat tinggi!",
          "Halo Kak! Terima kasih sudah menyapa! Penjualanmu hari ini pasti laris manis!",
          "GGMU! Nikmati eksplorasi 360 derajat model digital human fotorealistis!",
        ];
        const line = speechLines[touchCount % speechLines.length];
        const utt = new SpeechSynthesisUtterance(line);
        utt.lang = 'id-ID';
        utt.pitch = 1.15;
        utt.rate = 1.05;
        window.speechSynthesis.speak(utt);
      } catch {}
    }

    if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
    reactTimeoutRef.current = setTimeout(() => {
      setIsReacting(false);
    }, 4500);
  };

  // Trigger celebration when outfit equipped
  const triggerOutfitEquipped = (name: string) => {
    SoundFx.unlockAudio();
    SoundFx.playOutfitEquipSound();
    setIsReacting(true);
    setResponseText(`Outfit "${name}" berhasil terpasang di model 3D! Tampilan makin berkelas! ✨`);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(`Outfit ${name} siap digunakan!`);
        utt.lang = 'id-ID';
        window.speechSynthesis.speak(utt);
      } catch {}
    }

    if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
    reactTimeoutRef.current = setTimeout(() => {
      setIsReacting(false);
    }, 4500);
  };

  // Image Upload / Drag & Drop Handler (for Sophia Outfit)
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon gunakan file gambar (PNG, JPG, WEBP)');
      return;
    }

    ProcessingService.show({
      title: 'MEMPROSES OUTFIT 3D DIGITAL HUMAN',
      message: `Memetakan gambar "${file.name}" ke model 3D Sophia...`,
      durationMs: 1400,
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        setCustomImageElement(img);

        const newOutfit: OutfitConfig = {
          type: 'custom',
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20),
          imageUrl: dataUrl,
          mode: activeOutfit.mode || 'jersey',
          baseColor: activeOutfit.baseColor || '#C70101',
          accentColor: activeOutfit.accentColor || '#FFFFFF',
        };

        setActiveOutfit(newOutfit);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newOutfit));
        } catch {}
        triggerOutfitEquipped(newOutfit.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [activeOutfit, triggerOutfitEquipped]);

  // =========================================================================
  // 4. MESHY AI GLB 3D MODEL LOADER & PARSER
  // =========================================================================
  const parseAndMountGLTF = useCallback(
    (arrayBuffer: ArrayBuffer, name: string, switchToMeshy: boolean = true): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          setIsMeshyLoading(true);
          const inspection = inspect3DBuffer(arrayBuffer);
          if (!inspection.valid) {
            setIsMeshyLoading(false);
            if (inspection.isImage) {
              const mimeType =
                inspection.imageFormat === 'webp'
                  ? 'image/webp'
                  : inspection.imageFormat === 'png'
                  ? 'image/png'
                  : 'image/jpeg';
              const blob = new Blob([arrayBuffer], { type: mimeType });
              const imgFile = new File([blob], name, { type: mimeType });
              handleImageFile(imgFile);
              resolve(false);
              return;
            }
            console.warn('File bukan model 3D valid:', inspection.error);
            resolve(false);
            return;
          }

          const cleanBuffer = inspection.buffer;
          const loader = new GLTFLoader();
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
          loader.setDRACOLoader(dracoLoader);

          try {
            loader.parse(
              cleanBuffer,
              '',
              (gltf) => {
                if (meshyMixerRef.current) {
                  meshyMixerRef.current.stopAllAction();
                  meshyMixerRef.current = null;
                }

                // Enable shadows, double-sided materials, and PBR reflections on meshes
                gltf.scene.traverse((child) => {
                  if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    const m = child as THREE.Mesh;
                    if (m.material) {
                      if (Array.isArray(m.material)) {
                        m.material.forEach((mat) => {
                          mat.side = THREE.DoubleSide;
                          mat.needsUpdate = true;
                        });
                      } else {
                        m.material.side = THREE.DoubleSide;
                        m.material.needsUpdate = true;
                      }
                    }
                  }
                });

                // Calculate bounding box and center geometry
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                gltf.scene.position.x = -center.x;
                gltf.scene.position.y = -center.y;
                gltf.scene.position.z = -center.z;

                const maxDim = Math.max(size.x, size.y, size.z);
                const baseFitScale = maxDim > 0 ? 2.4 / maxDim : 1;
                baseFitScaleRef.current = baseFitScale;

                const wrapper = new THREE.Group();
                wrapper.name = 'MeshyGroupWrapper';
                wrapper.add(gltf.scene);
                wrapper.scale.setScalar(baseFitScale * meshyScale);
                wrapper.position.set(0, meshyOffsetY, 0);

                meshyGroupRef.current = wrapper;

                // If Three.js scene is currently running, hot-swap the model immediately!
                if (sceneRef.current) {
                  const toRemove: THREE.Object3D[] = [];
                  sceneRef.current.children.forEach(child => {
                    if (child.name === 'MeshyGroupWrapper') {
                      toRemove.push(child);
                    }
                  });
                  toRemove.forEach(c => sceneRef.current?.remove(c));
                  sceneRef.current.add(wrapper);
                }

                // Setup animation clips if Meshy model includes bones/skeleton
                if (gltf.animations && gltf.animations.length > 0) {
                  const mixer = new THREE.AnimationMixer(gltf.scene);
                  gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                  });
                  meshyMixerRef.current = mixer;
                }

                setActiveMeshyModelName(name);
                setActiveMeshyModelSize(cleanBuffer.byteLength);
                if (switchToMeshy) {
                  setEngineMode('meshy');
                }
                setIsMeshyLoading(false);

                // Persist locally in IndexedDB so reload preserves model
                MeshyModelStorage.saveModel(name, cleanBuffer).catch(() => {});

                SoundFx.playSkinTouchSound();
                resolve(true);
              },
              (err) => {
                console.warn('Meshy GLTF model parse warning:', err);
                setIsMeshyLoading(false);
                resolve(false);
              }
            );
          } catch (innerErr) {
            console.warn('GLTFLoader parse warning:', innerErr);
            setIsMeshyLoading(false);
            resolve(false);
          }
        } catch (err) {
          console.warn('GLTF Loader error:', err);
          setIsMeshyLoading(false);
          resolve(false);
        }
      });
    },
    [meshyScale, meshyOffsetY, handleImageFile]
  );

  const loadModelFromUrl = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        setIsMeshyLoading(true);
        const res = await fetch(url);
        if (!res.ok) {
          setIsMeshyLoading(false);
          return false;
        }
        const buf = await res.arrayBuffer();
        const filename = url.split('/').pop()?.split('?')[0] || 'model.glb';
        return await parseAndMountGLTF(buf, filename);
      } catch (err) {
        console.error('Failed to load model from URL:', err);
        setIsMeshyLoading(false);
        return false;
      }
    },
    [parseAndMountGLTF]
  );

  const handleResetMeshyToDefault = useCallback(() => {
    if (meshyMixerRef.current) {
      meshyMixerRef.current.stopAllAction();
      meshyMixerRef.current = null;
    }
    meshyGroupRef.current = null;
    setActiveMeshyModelName(null);
    setActiveMeshyModelSize(null);
    setEngineMode('scan');
    MeshyModelStorage.clearModel().catch(() => {});
  }, []);

  // Restore saved Meshy model from IndexedDB on mount OR automatically load official bundled GLB model
  // so any user opening on ANY phone automatically sees the real 3D athlete model!
  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to Cloud Avatar Settings (Realtime across all mobile & desktop devices)
    const unsub = AvatarSettingsService.subscribeToCloud((cloudCfg) => {
      if (!isMounted) return;
      setAvatarStudioConfig(cloudCfg);
      if (cloudCfg.engineMode) {
        setEngineMode(cloudCfg.engineMode);
      }
      if (cloudCfg.scale !== undefined) {
        setMeshyScale(cloudCfg.scale);
      }
      if (cloudCfg.offsetY !== undefined) {
        setMeshyOffsetY(cloudCfg.offsetY);
      }
      setActiveOutfit((prev) => ({
        ...prev,
        baseColor: cloudCfg.jerseyColor,
        accentColor: cloudCfg.accentColor,
        shortsColor: cloudCfg.shortsColor,
        backName: cloudCfg.backName,
        backNumber: cloudCfg.backNumber,
      }));
    });

    // 2. Load model from IndexedDB or fallback to official bundled GLB (without overriding user's webgl digital human)
    MeshyModelStorage.loadModel().then((saved) => {
      if (!isMounted) return;
      const initialMode = AvatarSettingsService.getConfig().engineMode;
      const shouldSwitchToMeshy = initialMode === 'meshy';
      if (saved && saved.buffer) {
        parseAndMountGLTF(saved.buffer, saved.name, shouldSwitchToMeshy);
      } else {
        // Automatically fetch official 3D athlete model from public directory
        loadModelFromUrl('/meshy_mu_athlete.glb').then((loaded) => {
          if (loaded && isMounted && shouldSwitchToMeshy) {
            setEngineMode('meshy');
          }
        });
      }
    });

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [parseAndMountGLTF, loadModelFromUrl]);

  // Universal File Drop & Select Handler (Supports 3D GLB Models & Outfit Images)
  const handleDroppedOrSelectedFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const inspection = inspect3DBuffer(arrayBuffer);

      if (inspection.valid) {
        ProcessingService.show({
          title: 'MEMUAT MODEL 3D MESHY AI',
          message: `Membaca model 3D "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`,
          durationMs: 1400,
        });
        const success = await parseAndMountGLTF(inspection.buffer, file.name);
        if (!success) {
          alert('Gagal memproses file 3D. Pastikan file adalah binary GLB dari Meshy AI.');
        }
        return;
      }

      if (inspection.isImage || file.type.startsWith('image/')) {
        handleImageFile(file);
        return;
      }

      // If neither a valid 3D model nor an image
      alert(`File "${file.name}" tidak dapat dimuat: ${inspection.error}`);
    } catch {
      handleImageFile(file);
    }
  };

  // =========================================================================
  // 5. THREE.JS WEBGL RUNTIME (PERSISTENT RENDERER & ANIMATION LOOP)
  // =========================================================================
  useEffect(() => {
    if (!webglCanvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    camera.position.set(0, 0.05, aspect < 1.0 ? 4.8 : 4.1);
    camera.lookAt(0, 0.05, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: webglCanvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    rendererRef.current = renderer;

    // Persistent Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xFFF9F5, 1.1);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xFFFAF2, 2.5);
    keyLight.position.set(2.4, 4.5, 3.8);
    keyLight.castShadow = true;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0xEAF2FA, 1.3);
    fillLight.position.set(-2.8, 2.6, 2.8);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(0x25F4EE, 1.6);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.25;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    // Mobile WebGL context recovery
    const canvas = webglCanvasRef.current;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost, recovering smoothly...');
    };
    const handleContextRestored = () => {
      console.info('WebGL context restored');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const currentEngine = engineModeRef.current;
      const currentTilt = tiltRef.current;
      const currentScale = meshyScaleRef.current;
      const currentOffsetY = meshyOffsetYRef.current;
      const currentConfig = avatarStudioConfigRef.current;

      if (currentEngine === 'meshy') {
        if (meshyMixerRef.current) {
          meshyMixerRef.current.update(delta);
        }
        if (meshyGroupRef.current) {
          meshyGroupRef.current.rotation.y = currentRotationRef.current;
          meshyGroupRef.current.rotation.x = (currentTilt.x * Math.PI) / 180;
          meshyGroupRef.current.rotation.z = (currentTilt.y * Math.PI) / 180;
          meshyGroupRef.current.position.y = currentOffsetY;
          meshyGroupRef.current.scale.setScalar(baseFitScaleRef.current * currentScale);
        }
      } else if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = currentRotationRef.current;
        avatarGroupRef.current.rotation.x = (currentTilt.x * Math.PI) / 180;
        avatarGroupRef.current.rotation.z = (currentTilt.y * Math.PI) / 180;

        // Pose gestures in digital human
        if (currentConfig.pose === 'idle') {
          avatarGroupRef.current.position.y = Math.sin(time * 2.2) * 0.008;
        } else if (currentConfig.pose === 'greeting') {
          avatarGroupRef.current.position.y = Math.sin(time * 1.6) * 0.006;
          const rArm = avatarGroupRef.current.getObjectByName('upperArmR');
          if (rArm) {
            rArm.rotation.z = -1.2 + Math.sin(time * 4.5) * 0.3;
          }
        } else if (currentConfig.pose === 'celebration') {
          avatarGroupRef.current.position.y = Math.abs(Math.sin(time * 3.5)) * 0.025;
          const rArm = avatarGroupRef.current.getObjectByName('upperArmR');
          const lArm = avatarGroupRef.current.getObjectByName('upperArmL');
          if (rArm) rArm.rotation.z = -2.3 + Math.sin(time * 3.0) * 0.15;
          if (lArm) lArm.rotation.z = 2.3 - Math.sin(time * 3.0) * 0.15;
        } else if (currentConfig.pose === 'business') {
          avatarGroupRef.current.position.y = Math.sin(time * 1.2) * 0.004;
          const rArm = avatarGroupRef.current.getObjectByName('upperArmR');
          const lArm = avatarGroupRef.current.getObjectByName('upperArmL');
          if (rArm) rArm.rotation.z = -0.55;
          if (lArm) lArm.rotation.z = 0.55;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        if (currentEngine !== 'scan') {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.dispose();
    };
  }, []);

  // Scene & Materials In-Place Synchronization (Zero Renderer Disposals, No Blank Screens)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 1. Update Lights in place
    if (ambientLightRef.current && keyLightRef.current && fillLightRef.current && rimLightRef.current) {
      let ambientColor = 0xFFF9F5;
      let ambientInt = 1.1;
      let keyColor = 0xFFFAF2;
      let keyInt = 2.5;
      let fillColor = 0xEAF2FA;
      let fillInt = 1.3;
      let rimColor = 0x25F4EE;
      let rimInt = 1.6;

      if (avatarStudioConfig.lightingPreset === 'neon') {
        ambientColor = 0x0F111E;
        ambientInt = 0.8;
        keyColor = 0x25F4EE;
        keyInt = 2.8;
        fillColor = 0xFE2C55;
        fillInt = 2.4;
        rimColor = 0x9333EA;
        rimInt = 3.0;
      } else if (avatarStudioConfig.lightingPreset === 'sunset') {
        ambientColor = 0xFEF3C7;
        ambientInt = 1.0;
        keyColor = 0xF59E0B;
        keyInt = 2.8;
        fillColor = 0xF43F5E;
        fillInt = 1.6;
        rimColor = 0xFFEDD5;
        rimInt = 2.0;
      } else if (avatarStudioConfig.lightingPreset === 'showroom') {
        ambientColor = 0xFFFFFF;
        ambientInt = 1.4;
        keyColor = 0xFFFFFF;
        keyInt = 2.2;
        fillColor = 0xF0F4F8;
        fillInt = 1.5;
        rimColor = 0xE2E8F0;
        rimInt = 1.2;
      }

      ambientLightRef.current.color.setHex(ambientColor);
      ambientLightRef.current.intensity = ambientInt;
      keyLightRef.current.color.setHex(keyColor);
      keyLightRef.current.intensity = keyInt;
      fillLightRef.current.color.setHex(fillColor);
      fillLightRef.current.intensity = fillInt;
      rimLightRef.current.color.setHex(rimColor);
      rimLightRef.current.intensity = rimInt;
    }

    // 2. Manage 3D Models in Scene with zero garbage collection spikes
    if (!avatarGroupRef.current) {
      // First-time build: Instantiate Digital Human meshes ONCE
      const skinTex = createPhotorealisticSkinTexture();
      const skinBumpMap = createPhotorealisticSkinBumpMap();
      const skinMaterial = new THREE.MeshPhysicalMaterial({
        map: skinTex,
        bumpMap: skinBumpMap,
        bumpScale: 0.0035,
        roughness: 0.38,
        color: new THREE.Color(avatarStudioConfig.skinTone || '#FFF5EE'),
      });
      skinMaterialRef.current = skinMaterial;

      const eyeTex = createPhotorealisticEyeTexture();
      const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xFDFBF8 });
      const irisMaterial = new THREE.MeshStandardMaterial({
        map: eyeTex,
        color: new THREE.Color(avatarStudioConfig.eyeColor || '#38BDF8'),
      });
      irisMaterialRef.current = irisMaterial;

      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x050706 });
      const tearDuctMaterial = new THREE.MeshStandardMaterial({ color: 0xEE929C });
      const hairTex = createPhotorealisticHairTexture();
      const hairMaterial = new THREE.MeshStandardMaterial({
        map: hairTex,
        color: new THREE.Color(avatarStudioConfig.hairColor || '#1A1210'),
      });
      hairMaterialRef.current = hairMaterial;

      const lipsMaterial = new THREE.MeshPhysicalMaterial({ color: 0xD06072, roughness: 0.16 });
      const nailMaterial = new THREE.MeshPhysicalMaterial({ color: 0xFFE0D8 });

      const mergedOutfitConfig: OutfitConfig = {
        ...activeOutfit,
        backName: avatarStudioConfig.backName || activeOutfit.backName,
        backNumber: avatarStudioConfig.backNumber || activeOutfit.backNumber,
        baseColor: avatarStudioConfig.jerseyColor || activeOutfit.baseColor,
        accentColor: avatarStudioConfig.accentColor || activeOutfit.accentColor,
        shortsColor: avatarStudioConfig.shortsColor || activeOutfit.shortsColor,
      };

      const jerseyTex = generateOutfitTexture(mergedOutfitConfig, customImageElement);
      const jerseyMaterial = new THREE.MeshStandardMaterial({
        map: jerseyTex,
        roughness: 0.45,
        metalness: 0.1,
      });
      jerseyMaterialRef.current = jerseyMaterial;

      const shortsTex = generateShortsTexture(
        avatarStudioConfig.shortsColor || activeOutfit.shortsColor || '#FFFFFF',
        avatarStudioConfig.accentColor || activeOutfit.accentColor || '#C70101'
      );
      const shortsMaterial = new THREE.MeshStandardMaterial({
        map: shortsTex,
        roughness: 0.45,
        metalness: 0.1,
      });
      shortsMaterialRef.current = shortsMaterial;

      const sockMaterial = new THREE.MeshStandardMaterial({ color: 0x14141A });
      const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0xFDFDFD });
      const shoeSoleMaterial = new THREE.MeshStandardMaterial({ color: 0x18181E });
      const redTrimMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(avatarStudioConfig.accentColor || '#C70101'),
      });
      redTrimMaterialRef.current = redTrimMaterial;

      const materials: HumanMaterials = {
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
      };

      const meshes = buildPhotorealisticDigitalHuman(scene, materials);
      avatarGroupRef.current = meshes.avatarGroup;
    } else {
      // Subsequent updates: Mutate existing materials in-place (ZERO memory allocations, NO lag)
      let jerseyRoughness = 0.45;
      let jerseyMetalness = 0.1;
      if (avatarStudioConfig.materialFinish === 'matte') {
        jerseyRoughness = 0.88;
        jerseyMetalness = 0.02;
      } else if (avatarStudioConfig.materialFinish === 'glossy') {
        jerseyRoughness = 0.15;
        jerseyMetalness = 0.25;
      } else if (avatarStudioConfig.materialFinish === 'metallic') {
        jerseyRoughness = 0.22;
        jerseyMetalness = 0.85;
      }

      if (skinMaterialRef.current) {
        skinMaterialRef.current.color.set(avatarStudioConfig.skinTone || '#FFF5EE');
      }
      if (hairMaterialRef.current) {
        hairMaterialRef.current.color.set(avatarStudioConfig.hairColor || '#1A1210');
      }
      if (irisMaterialRef.current) {
        irisMaterialRef.current.color.set(avatarStudioConfig.eyeColor || '#38BDF8');
      }
      if (redTrimMaterialRef.current) {
        redTrimMaterialRef.current.color.set(avatarStudioConfig.accentColor || '#C70101');
      }

      const mergedOutfitConfig: OutfitConfig = {
        ...activeOutfit,
        backName: avatarStudioConfig.backName || activeOutfit.backName,
        backNumber: avatarStudioConfig.backNumber || activeOutfit.backNumber,
        baseColor: avatarStudioConfig.jerseyColor || activeOutfit.baseColor,
        accentColor: avatarStudioConfig.accentColor || activeOutfit.accentColor,
        shortsColor: avatarStudioConfig.shortsColor || activeOutfit.shortsColor,
      };

      if (jerseyMaterialRef.current) {
        const jerseyTex = generateOutfitTexture(mergedOutfitConfig, customImageElement);
        jerseyMaterialRef.current.map = jerseyTex;
        jerseyMaterialRef.current.roughness = jerseyRoughness;
        jerseyMaterialRef.current.metalness = jerseyMetalness;
        jerseyMaterialRef.current.needsUpdate = true;
      }

      if (shortsMaterialRef.current) {
        const shortsTex = generateShortsTexture(
          avatarStudioConfig.shortsColor || activeOutfit.shortsColor || '#FFFFFF',
          avatarStudioConfig.accentColor || activeOutfit.accentColor || '#C70101'
        );
        shortsMaterialRef.current.map = shortsTex;
        shortsMaterialRef.current.roughness = jerseyRoughness;
        shortsMaterialRef.current.metalness = jerseyMetalness;
        shortsMaterialRef.current.needsUpdate = true;
      }
    }

    // Toggle visibility between models cleanly
    if (engineMode === 'meshy') {
      if (avatarGroupRef.current) avatarGroupRef.current.visible = false;
      if (meshyGroupRef.current) {
        meshyGroupRef.current.visible = true;
        if (!meshyGroupRef.current.parent) scene.add(meshyGroupRef.current);
      }
    } else if (engineMode === 'webgl') {
      if (meshyGroupRef.current) meshyGroupRef.current.visible = false;
      if (avatarGroupRef.current) {
        avatarGroupRef.current.visible = true;
        if (!avatarGroupRef.current.parent) scene.add(avatarGroupRef.current);
      }
    } else {
      // scan mode: hide both 3D groups
      if (meshyGroupRef.current) meshyGroupRef.current.visible = false;
      if (avatarGroupRef.current) avatarGroupRef.current.visible = false;
    }
  }, [engineMode, avatarStudioConfig, activeOutfit, customImageElement, activeMeshyModelName]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[85vh] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#06070B] via-[#0B0D14] to-[#06070B] select-none"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFileOver(true);
      }}
      onDragLeave={() => setIsDraggingFileOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFileOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleDroppedOrSelectedFile(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Universal Hidden File Input (Supports GLB/TXT Meshy 3D Models and Outfit Images) */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".glb,.gltf,.txt,.bin,model/gltf-binary,model/gltf+json,application/octet-stream,image/png,image/jpeg,image/webp,*/*" 
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleDroppedOrSelectedFile(e.target.files[0]);
          }
        }}
      />

      {/* Drag & Drop Highlight */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-50 bg-black/85 border-4 border-dashed border-[#25F4EE] backdrop-blur-md flex flex-col items-center justify-center text-white animate-pulse p-6 text-center">
          <div className="p-4 rounded-2xl bg-[#25F4EE]/20 border border-[#25F4EE]/50 mb-4 animate-bounce">
            <Box className="w-14 h-14 text-[#25F4EE]" />
          </div>
          <h2 className="text-xl font-black tracking-wide uppercase text-white">
            Lepaskan File Model 3D (.glb) atau Gambar Outfit di Sini
          </h2>
          <p className="text-sm text-zinc-300 max-w-md mt-2">
            File 3D (.glb) otomatis dimuat ke Three.js 3D Viewer. File gambar otomatis dipetakan ke jersey Sophia.
          </p>
        </div>
      )}

      {/* Studio Lighting Background Glow & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-[#FE2C55]/15 via-[#C70101]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* =================================================================== */}
      {/* TOP FLOATING HUD BAR                                                */}
      {/* =================================================================== */}
      <div className="relative z-30 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Clean App Brand Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="relative p-2 rounded-xl bg-black/70 border border-[#FE2C55]/50 text-[#FE2C55] shadow-[0_0_20px_rgba(254,44,85,0.35)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#25F4EE] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 rounded-full bg-[#FE2C55] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white tracking-wider uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                Seller Profit
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#25F4EE]/15 border border-[#25F4EE]/30 text-[#25F4EE] text-[9px] font-mono font-bold">
                PRO 360°
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls - Wrapped nicely so nothing is cut off on mobile right edge */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end shrink-0 max-w-full">
          {/* Compass / Angle Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-zinc-300 text-xs font-mono">
            <Compass className="w-3.5 h-3.5 text-[#25F4EE] animate-spin" style={{ animationDuration: '10s' }} />
            <span>{rotationDeg}°</span>
          </div>

          {/* Avatar Character Development Studio Button */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setIsStudioModalOpen(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FE2C55]/25 via-[#C70101]/25 to-[#FE2C55]/25 hover:from-[#FE2C55]/35 hover:to-[#C70101]/35 border border-[#FE2C55]/50 text-white text-xs font-black tracking-wide flex items-center gap-1.5 shadow-[0_0_15px_rgba(254,44,85,0.25)] transition active:scale-95 cursor-pointer"
            title="Pengaturan Karakter Avatar 3D"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span>Studio 3D</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-mono border border-emerald-500/30">
              Cloud
            </span>
          </button>

          {/* Auto Spin Toggle */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setIsAutoSpin(prev => !prev);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              isAutoSpin
                ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE] shadow-[0_0_15px_rgba(37,244,238,0.3)]'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300'
            }`}
            title="Putar Otomatis 360 Derajat"
          >
            {isAutoSpin ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#25F4EE]" />}
            <span className="hidden sm:inline">{isAutoSpin ? 'Stop' : 'Auto 360°'}</span>
          </button>

          {/* Ganti Outfit Button */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setIsOutfitDrawerOpen(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
            title="Buka Menu Ganti Jersey & Custom Outfit"
          >
            <Shirt className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span className="hidden sm:inline">Outfit</span>
          </button>

          {/* Primary Login Button */}
          <button
            type="button"
            id="btn-login-hero"
            onClick={() => {
              SoundFx.unlockAudio();
              onOpenLoginModal();
            }}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#ff476d] hover:from-[#ff3d66] hover:to-[#FE2C55] text-white text-xs sm:text-sm font-black tracking-wide uppercase flex items-center gap-1.5 shadow-[0_0_25px_rgba(254,44,85,0.5)] transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>Masuk</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN 360° INTERACTIVE STAGE                                         */}
      {/* =================================================================== */}
      <div 
        ref={stageRef}
        className="relative flex-1 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handlePointerUp}
      >
        {/* ================================================================= */}
        {/* PHOTOREALISTIC 3D SCAN TURNTABLE MODE                             */}
        {/* ================================================================= */}
        {engineMode === 'scan' ? (
          <div 
            onClick={handleStageClick}
            className="relative w-full max-w-[460px] h-[55vh] sm:h-[65vh] max-h-[640px] flex items-center justify-center transition-transform duration-100 ease-out"
            style={{
              perspective: '1200px',
              transform: `rotateX(${tiltRef.current.x}deg) rotateY(${tiltRef.current.y}deg)`,
            }}
          >
            {/* Ambient Lighting Specular Glare */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-3xl opacity-30 mix-blend-overlay transition-opacity"
              style={{
                background: `radial-gradient(circle at ${50 + tiltRef.current.y * 3}% ${40 + tiltRef.current.x * 3}%, rgba(255,255,255,0.4), transparent 70%)`
              }}
            />

            {/* Render 1: Front (0° / 360°) */}
            <img
              src={sophiaFront}
              alt="Model Sophia 3D Depan - Jersey Manchester United"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
              style={{
                opacity: isReacting ? 0 : angleWeights.front,
                filter: activeOutfit.type === 'custom' && activeOutfit.baseColor !== '#C70101' ? 'contrast(1.05)' : undefined,
              }}
            />

            {/* Render 2: Side Profile (90°) */}
            <img
              src={sophiaSide}
              alt="Model Sophia 3D Samping Kanan - Jersey Manchester United"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
              style={{
                opacity: isReacting ? 0 : angleWeights.side,
              }}
            />

            {/* Render 3: Back View (180°) */}
            <img
              src={sophiaBack}
              alt="Model Sophia 3D Belakang - Jersey Manchester United"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
              style={{
                opacity: isReacting ? 0 : angleWeights.back,
              }}
            />

            {/* Render 4: Left Side Profile (270°) */}
            <img
              src={sophiaLeft}
              alt="Model Sophia 3D Samping Kiri - Jersey Manchester United"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
              style={{
                opacity: isReacting ? 0 : angleWeights.left,
              }}
            />

            {/* Render 5: Interactive Cheering / Waving Pose */}
            <img
              src={sophiaReact}
              alt="Model Sophia 3D Reaksi Sapaan Ramah"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isReacting ? 1 : 0,
                transform: isReacting ? 'scale(1.02)' : 'scale(1)',
              }}
            />

            {/* Custom Brand Logo / Image Overlay if uploaded */}
            {activeOutfit.type === 'custom' && activeOutfit.imageUrl && !isReacting && angleWeights.front > 0.4 && (
              <div 
                className="absolute pointer-events-none transition-opacity duration-200"
                style={{
                  top: activeOutfit.mode === 'logo' ? '33%' : '37%',
                  left: '49%',
                  transform: 'translate(-50%, -50%)',
                  width: activeOutfit.mode === 'full' ? '140px' : '65px',
                  opacity: angleWeights.front,
                }}
              >
                <img 
                  src={activeOutfit.imageUrl} 
                  alt="Custom Brand Overlay" 
                  className="w-full h-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                />
              </div>
            )}

            {/* ============================================================= */}
            {/* INTERACTIVE 3D HOTSPOT PINS                                   */}
            {/* ============================================================= */}
            {showHotspots && !isReacting && (
              <>
                {JERSEY_HOTSPOTS.map((spot) => {
                  const visible = isHotspotVisible(spot);
                  if (!visible) return null;

                  return (
                    <div
                      key={spot.id}
                      className="absolute z-30 transition-all duration-300"
                      style={{
                        top: `${spot.yPercent}%`,
                        left: `${spot.xPercent}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundFx.unlockAudio();
                        SoundFx.playJerseyRotateTick();
                        setActiveHotspot(activeHotspot?.id === spot.id ? null : spot);
                      }}
                    >
                      <button
                        type="button"
                        className="relative w-6 h-6 rounded-full bg-[#FE2C55]/90 hover:bg-[#FE2C55] text-white flex items-center justify-center shadow-[0_0_15px_rgba(254,44,85,0.6)] cursor-pointer group transition-transform hover:scale-125"
                        title={spot.title}
                      >
                        <span className="absolute inset-0 rounded-full bg-[#FE2C55] animate-ping opacity-75" />
                        <span className="w-2 h-2 rounded-full bg-white shadow-inner" />
                      </button>

                      {/* Detail Popover Card */}
                      {activeHotspot?.id === spot.id && (
                        <div 
                          className="absolute left-7 top-1/2 -translate-y-1/2 w-60 p-3 rounded-2xl bg-black/90 border border-[#FE2C55]/60 text-white shadow-2xl backdrop-blur-md z-40 animate-fadeIn pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-white/10 mb-1.5">
                            <span className="text-[10px] font-black text-[#FE2C55] uppercase tracking-wider">
                              Fitur Otentik
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveHotspot(null)}
                              className="text-zinc-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-white">{spot.title}</h4>
                          <p className="text-[10px] text-[#25F4EE] font-medium">{spot.subtitle}</p>
                          <p className="text-[10px] text-zinc-300 mt-1 leading-snug">{spot.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          /* WebGL Three.js Procedural Avatar & Meshy 3D Canvas */
          <div 
            onClick={handleStageClick}
            className="relative w-full max-w-[460px] h-[55vh] sm:h-[65vh] max-h-[640px] flex items-center justify-center"
          >
            <canvas 
              ref={webglCanvasRef}
              className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
            />
          </div>
        )}

        {/* Touch Ripple Visuals */}
        {ripples.map(r => (
          <span 
            key={r.id}
            className="absolute rounded-full pointer-events-none animate-ping"
            style={{
              left: r.x - 25,
              top: r.y - 25,
              width: 50,
              height: 50,
              backgroundColor: r.color,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Speech / Reaction Bubble */}
        {isReacting && responseText && (
          <div className="absolute top-14 sm:top-18 max-w-sm px-4 py-2.5 rounded-2xl bg-black/90 border border-[#FE2C55]/60 text-white text-xs sm:text-sm font-medium shadow-[0_0_30px_rgba(254,44,85,0.4)] backdrop-blur-md animate-bounce flex items-center gap-2.5 z-40 pointer-events-none">
            <MessageCircle className="w-4 h-4 text-[#FE2C55] shrink-0 animate-pulse" />
            <span className="leading-snug">{responseText}</span>
          </div>
        )}

        {/* Active Model & Outfit Tag */}
        <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white backdrop-blur-sm">
          <Sparkle className="w-3.5 h-3.5 text-[#FE2C55]" />
          <span className="text-zinc-400">Karakter 3D:</span>
          <span className="font-bold text-white">Sophia</span>
          <span className="text-zinc-500">•</span>
          <span className="text-[#25F4EE] font-semibold">{activeOutfit.name}</span>
        </div>

        {/* 360° Swipe Gesture Hint */}
        {showSwipeHint && !isAutoSpin && (
          <div className="absolute bottom-16 sm:bottom-20 z-20 pointer-events-none animate-pulse">
            <div className="px-4 py-1.5 rounded-full bg-black/80 border border-[#FE2C55]/50 text-xs text-zinc-200 flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <Hand className="w-4 h-4 text-[#FE2C55] animate-pulse" />
              <span>Geser layar untuk memutar 360° bebas • Sentuh untuk respon</span>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* BOTTOM FLOATING BAR - RESPONSIVE HOLOGRAPHIC CONTROL DOCK           */}
      {/* =================================================================== */}
      <div className="relative z-30 w-full max-w-2xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Centered Responsive Status Pill - Wraps naturally, never overflows screen */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-black/80 border border-[#25F4EE]/35 text-[10px] sm:text-xs text-zinc-300 backdrop-blur-md shadow-md text-center max-w-[95vw]">
          <span className="inline-flex items-center gap-1 text-white font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55] animate-ping" />
            Putar 360° Bebas
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300 hidden xs:inline">Sentuh avatar untuk respon suara</span>
          <span className="text-zinc-500 hidden xs:inline">•</span>
          <span className="text-[#25F4EE] font-mono font-bold">{rotationDeg}° ({cardinalText})</span>
        </div>

        {/* Action Button Dock - Clean wrap, 100% clickable with 38px touch targets */}
        <div className="spatial-card w-full p-2 sm:p-2.5 rounded-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {/* Character Studio Trigger */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setIsStudioModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FE2C55]/25 to-[#C70101]/25 hover:from-[#FE2C55]/40 hover:to-[#C70101]/40 border border-[#FE2C55]/50 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition shadow-[0_0_12px_rgba(254,44,85,0.3)] min-h-[38px]"
            title="Buka Pengaturan Karakter Avatar"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span>Studio 3D</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-mono border border-emerald-500/30">
              Cloud
            </span>
          </button>

          {/* Quick Ganti Baju Trigger */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setIsOutfitDrawerOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm min-h-[38px]"
            title="Ganti Outfit / Upload Gambar Baju Sendiri"
          >
            <Upload className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span>Ganti Baju</span>
          </button>

          {/* Sapa Avatar Button */}
          <button
            type="button"
            onClick={(e) => handleStageClick(e as any)}
            className="px-3 py-1.5 rounded-xl bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 border border-[#FE2C55]/50 text-[#FE2C55] text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition min-h-[38px]"
            title="Sentuh untuk sapaan dan reaksi suara avatar"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sapa Avatar</span>
            {touchCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#25F4EE] text-zinc-950 text-[9px] font-black">
                {touchCount}
              </span>
            )}
          </button>

          {/* Hotspots Toggle */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              setShowHotspots(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 min-h-[38px] ${
              showHotspots
                ? 'bg-[#FE2C55]/20 border-[#FE2C55]/50 text-[#FE2C55]'
                : 'bg-white/5 border-white/15 text-zinc-300 hover:text-white'
            }`}
            title="Tampilkan / Sembunyikan Titik Fitur Jersey"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Hotspot</span>
          </button>

          {/* Scroll ke Edukasi & Keuntungan */}
          <button
            type="button"
            onClick={() => {
              SoundFx.unlockAudio();
              const el = document.getElementById('edukasi-seller-profit');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#25F4EE]/15 to-[#FE2C55]/15 hover:from-[#25F4EE]/25 hover:to-[#FE2C55]/25 border border-[#25F4EE]/40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition min-h-[38px]"
            title="Pelajari Edukasi & Keuntungan Aplikasi Seller Profit"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Edukasi</span>
            <ChevronDown className="w-3 h-3 text-zinc-400 animate-bounce ml-0.5" />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* DRAWER / MODAL: GANTI OUTFIT & IMPORT GAMBAR                        */}
      {/* =================================================================== */}
      {isOutfitDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#11131a] border border-[#FE2C55]/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(254,44,85,0.2)] max-h-[90vh] overflow-y-auto text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FE2C55]/20 border border-[#FE2C55]/50 text-[#FE2C55]">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                    <span>Ganti Pakaian Model 3D</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#FE2C55]" />
                  </h3>
                  <p className="text-xs text-zinc-400">Pilih edisi Jersey Manchester United atau pasang gambar tokomu</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOutfitDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Official Manchester United Edition Presets */}
            <div className="mt-5">
              <label className="text-xs font-bold text-[#FE2C55] uppercase tracking-wider block mb-2">
                1. Pilihan Koleksi Jersey Manchester United
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OUTFIT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const updated: OutfitConfig = {
                        type: p.id === 'mu-home' ? 'default-mu' : 'preset',
                        presetId: p.id,
                        name: p.name,
                        mode: p.mode,
                        baseColor: p.baseColor,
                        accentColor: p.accentColor,
                      };
                      setActiveOutfit(updated);
                      setCustomImageElement(null);
                      try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                      } catch {}
                      triggerOutfitEquipped(p.name);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                      activeOutfit.type !== 'custom' && (activeOutfit.presetId === p.id || (p.id === 'mu-home' && activeOutfit.type === 'default-mu'))
                        ? 'bg-[#FE2C55]/25 border-[#FE2C55] text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20 shadow-inner" 
                        style={{ backgroundColor: p.baseColor }} 
                      />
                      <div>
                        <span className="text-xs font-bold block">{p.name}</span>
                        <span className="text-[9px] text-zinc-400 font-mono">{p.tag}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Drag & Drop File Upload Box */}
            <div className="mt-5">
              <label className="text-xs font-bold text-[#25F4EE] uppercase tracking-wider block mb-2">
                2. Pasang Gambar / Logo Toko Pribadi
              </label>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#25F4EE]/50 hover:border-[#25F4EE] bg-[#161823]/90 hover:bg-[#1c1f2e] rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center gap-3 group"
              >
                <div className="p-3.5 rounded-full bg-[#25F4EE]/10 group-hover:bg-[#25F4EE]/20 border border-[#25F4EE]/40 text-[#25F4EE] transition-transform group-hover:scale-110">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-white group-hover:text-[#25F4EE] transition">
                    Klik untuk Pilih Gambar atau Tarik &amp; Lepas (Drag &amp; Drop)
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">
                    Mendukung PNG transparan, JPG, WEBP (Logo brand tokomu, sablon kustom, dll)
                  </span>
                </div>

                {/* Active Custom Image Preview if available */}
                {activeOutfit.type === 'custom' && activeOutfit.imageUrl && (
                  <div className="flex items-center gap-3 mt-1 p-2 rounded-xl bg-black/60 border border-white/10 w-full justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={activeOutfit.imageUrl} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-[#25F4EE]/40" 
                      />
                      <div className="text-left truncate">
                        <span className="text-[11px] font-bold text-white block truncate">{activeOutfit.name}</span>
                        <span className="text-[9px] text-[#25F4EE]">Sedang Terpasang di Dada Sophia</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#25F4EE]/20 hover:bg-[#25F4EE]/30 text-[#25F4EE] text-[10px] font-bold border border-[#25F4EE]/40"
                    >
                      Ganti Gambar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Base Color Palettes */}
            <div className="mt-5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                3. Pilihan Aksen Warna Dasar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {BASE_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      const updated: OutfitConfig = {
                        ...activeOutfit,
                        baseColor: c.value,
                        accentColor: c.accent,
                      };
                      setActiveOutfit(updated);
                      try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                      } catch {}
                    }}
                    className={`h-10 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                      activeOutfit.baseColor === c.value ? 'ring-2 ring-[#FE2C55] border-white' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {activeOutfit.baseColor === c.value && (
                      <Check className="w-4 h-4" style={{ color: c.accent }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const defaultMU: OutfitConfig = {
                    type: 'default-mu',
                    name: 'Jersey Manchester United 24/25',
                    mode: 'jersey',
                    baseColor: '#C70101',
                    accentColor: '#FFFFFF',
                  };
                  setActiveOutfit(defaultMU);
                  setCustomImageElement(null);
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMU));
                  } catch {}
                  triggerOutfitEquipped('Jersey MU Home Asli');
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Jersey MU Asli</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOutfitDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#ff476d] hover:from-[#ff3d66] hover:to-[#FE2C55] text-white font-black text-xs tracking-wider uppercase cursor-pointer shadow-lg shadow-[#FE2C55]/25 transition"
              >
                Selesai / Pasang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meshy AI 3D Model Modal */}
      <MeshyModelModal
        isOpen={isMeshyModalOpen}
        onClose={() => setIsMeshyModalOpen(false)}
        activeModelName={activeMeshyModelName}
        activeModelSize={activeMeshyModelSize}
        onLoadModelBuffer={async (buffer, name) => {
          const ok = await parseAndMountGLTF(buffer, name);
          if (ok) {
            setEngineMode('meshy');
          }
          return ok;
        }}
        onLoadModelUrl={loadModelFromUrl}
        onResetToDefault={handleResetMeshyToDefault}
        isMeshyActive={engineMode === 'meshy'}
        modelScale={meshyScale}
        onScaleChange={(scale) => {
          setMeshyScale(scale);
          if (meshyGroupRef.current) {
            meshyGroupRef.current.scale.setScalar(baseFitScaleRef.current * scale);
          }
        }}
        modelOffsetY={meshyOffsetY}
        onOffsetYChange={(offset) => {
          setMeshyOffsetY(offset);
          if (meshyGroupRef.current) {
            meshyGroupRef.current.position.y = offset;
          }
        }}
      />

      {/* Avatar Character Development Studio Modal */}
      <AvatarCustomizerModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        initialConfig={avatarStudioConfig}
        onOpenMeshyUpload={() => {
          setIsStudioModalOpen(false);
          setIsMeshyModalOpen(true);
        }}
        onConfigChange={(newCfg) => {
          setAvatarStudioConfig(newCfg);
          setEngineMode(newCfg.engineMode);
          if (newCfg.scale !== undefined) {
            setMeshyScale(newCfg.scale);
          }
          if (newCfg.offsetY !== undefined) {
            setMeshyOffsetY(newCfg.offsetY);
          }
          setActiveOutfit((prev) => ({
            ...prev,
            baseColor: newCfg.jerseyColor,
            accentColor: newCfg.accentColor,
            shortsColor: newCfg.shortsColor,
            backName: newCfg.backName,
            backNumber: newCfg.backNumber,
          }));
        }}
      />
    </div>
  );
};
