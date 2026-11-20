import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Zap,
  RotateCw,
  Pause,
  BookmarkPlus,
  Trash2,
} from 'lucide-react';
import type { CarSpec } from '../data/cars';
import type { SavedStudioBuild } from '../lib/api';
import {
  buildProceduralCar,
  createContactShadowTexture,
  createTurntableTexture,
  type BuiltCarRig,
  type FinishType,
  type WheelStyle,
} from '../three/CarModelBuilder';
import { EngineSoundSynthesizer } from '../audio/engineSound';
import { CarImage } from './CarImage';

interface Studio3DProps {
  cars: CarSpec[];
  selectedCar: CarSpec;
  onSelectCar: (car: CarSpec) => void;
  savedBuilds: SavedStudioBuild[];
  savingBuild: boolean;
  onSaveBuild: (payload: {
    carId: string;
    buildName: string;
    paintColor: string;
    finish: FinishType;
    wheelStyle: WheelStyle;
    rideHeight: number;
  }) => Promise<boolean>;
  onDeleteBuild: (buildId: number) => Promise<void>;
}

type StudioTab = 'finish' | 'wheels' | 'sound' | 'builds';
type CameraPresetId = 'hero' | 'side' | 'front' | 'rear';

const PAINT_SWATCHES = [
  { name: 'Rosso Corsa', hex: '#c60022' },
  { name: 'Chalk White', hex: '#e5e7eb' },
  { name: 'Obsidian Black', hex: '#14171f' },
  { name: 'Le Mans Blue', hex: '#173e83' },
  { name: 'Champagne Gold', hex: '#d6b45d' },
  { name: 'British Racing Green', hex: '#19804b' },
];

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  hero: { label: 'Three-Quarter', pos: [5.4, 2.35, 5.2], target: [0, 0.55, 0] },
  side: { label: 'Side Profile', pos: [0.1, 1.35, 6.6], target: [0, 0.55, 0] },
  front: { label: 'Front Aero', pos: [6.0, 1.45, 0.5], target: [0, 0.5, 0] },
  rear: { label: 'Rear Diffuser', pos: [-6.0, 1.55, -0.7], target: [0, 0.55, 0] },
};

// Module-scope reusable math helpers (zero GC in render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const Studio3D: React.FC<Studio3DProps> = ({
  cars,
  selectedCar,
  onSelectCar,
  savedBuilds,
  savingBuild,
  onSaveBuild,
  onDeleteBuild,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const soundSynthRef = useRef<EngineSoundSynthesizer | null>(null);
  const pendingBuildLoadRef = useRef<SavedStudioBuild | null>(null);

  const [paintColor, setPaintColor] = useState<string>(selectedCar.defaultColor);
  const [finish, setFinish] = useState<FinishType>('metallic');
  const [wheelStyle, setWheelStyle] = useState<WheelStyle>('sport');
  const [rideHeight, setRideHeight] = useState<number>(50);
  const [buildName, setBuildName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<StudioTab>('finish');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPresetId>('hero');
  const [webglLost, setWebglLost] = useState<boolean>(false);

  // Audio state
  const [engineRunning, setEngineRunning] = useState<boolean>(false);
  const [rpm, setRpm] = useState<number>(1200);
  const [soundNote, setSoundNote] = useState<string>(
    'Synthetic Web Audio demonstration. Not an authentic vehicle recording.',
  );

  // Refs synced to Three.js without re-creating renderer
  const threeStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    carRig: BuiltCarRig | null;
    turntableGroup: THREE.Group;
    isSoftwareGl: boolean;
    baseGroundClearance: number;
    targetRideOffset: number;
    currentRideOffset: number;
    camAnimating: boolean;
    autoRotate: boolean;
    requestRender: () => void;
  } | null>(null);

  // Sync paint color when switching vehicle (unless loading a saved build)
  useEffect(() => {
    const pending = pendingBuildLoadRef.current;
    if (pending && pending.carId === selectedCar.id) {
      setPaintColor(pending.paintColor);
      setFinish(pending.finish);
      setWheelStyle(pending.wheelStyle);
      setRideHeight(pending.rideHeight);
      pendingBuildLoadRef.current = null;
    } else {
      setPaintColor(selectedCar.defaultColor);
    }
    if (engineRunning) {
      soundSynthRef.current?.setRPM(rpm, selectedCar);
    }
    setSoundNote(
      `Loaded ${selectedCar.brand} ${selectedCar.model} · Synthetic sound demonstration.`,
    );
  }, [selectedCar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Initialize Three.js WebGL Viewport once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(mount.clientWidth, 320);
    const height = Math.max(mount.clientHeight, 440);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const domEl = renderer.domElement;
    domEl.style.display = 'block';
    domEl.style.width = '100%';
    domEl.style.height = '100%';
    mount.appendChild(domEl);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => {
      setWebglLost(false);
    };
    domEl.addEventListener('webglcontextlost', onContextLost);
    domEl.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.042);

    // Studio IBL reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const controls = new OrbitControls(camera, domEl);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 12;
    controls.minPolarAngle = 0.22;
    controls.maxPolarAngle = Math.PI * 0.482;

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xcfe0ff, 0x1a1c22, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.4);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    const d = 5.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9bc4ff, 1.35);
    rimLight.position.set(-6, 5, -6);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const overheadSoftbox = new THREE.RectAreaLight(0xffffff, 2.8, 7, 3.2);
      overheadSoftbox.position.set(0, 4.8, 0.4);
      overheadSoftbox.lookAt(0, 0, 0);
      scene.add(overheadSoftbox);
    }

    // Ground floor & turntable podium
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f17,
      roughness: 0.88,
      metalness: 0.12,
    });
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const turntableGroup = new THREE.Group();
    const turntableTex = createTurntableTexture(
      renderer.capabilities.getMaxAnisotropy(),
    );
    const podiumGeo = new THREE.CylinderGeometry(3.65, 3.85, 0.04, 64);
    const podiumTopMat = new THREE.MeshStandardMaterial({
      map: turntableTex,
      roughness: 0.42,
      metalness: 0.35,
    });
    const podiumSideMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.5,
      metalness: 0.6,
    });
    const podiumMesh = new THREE.Mesh(podiumGeo, [
      podiumSideMat,
      podiumTopMat,
      podiumSideMat,
    ]);
    podiumMesh.position.y = -0.02;
    podiumMesh.receiveShadow = true;
    turntableGroup.add(podiumMesh);

    // Contact shadow grounding plane
    const shadowTex = createContactShadowTexture();
    const shadowPlaneGeo = new THREE.PlaneGeometry(5.6, 2.8);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.004;
    turntableGroup.add(shadowPlane);

    scene.add(turntableGroup);

    // Initial car build
    const initialRig = buildProceduralCar(
      selectedCar.archetype,
      selectedCar.defaultColor,
      'metallic',
      'sport',
    );
    turntableGroup.add(initialRig.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const delta = Math.min(clock.getDelta(), 0.1);
        const state = threeStateRef.current;

        let keepAnimating = false;
        if (state) {
          // Smooth camera preset damping
          if (state.camAnimating) {
            const lambda = 6.5;
            camera.position.x = THREE.MathUtils.damp(
              camera.position.x,
              _targetCamPos.x,
              lambda,
              delta,
            );
            camera.position.y = THREE.MathUtils.damp(
              camera.position.y,
              _targetCamPos.y,
              lambda,
              delta,
            );
            camera.position.z = THREE.MathUtils.damp(
              camera.position.z,
              _targetCamPos.z,
              lambda,
              delta,
            );
            controls.target.x = THREE.MathUtils.damp(
              controls.target.x,
              _targetLookAt.x,
              lambda,
              delta,
            );
            controls.target.y = THREE.MathUtils.damp(
              controls.target.y,
              _targetLookAt.y,
              lambda,
              delta,
            );
            controls.target.z = THREE.MathUtils.damp(
              controls.target.z,
              _targetLookAt.z,
              lambda,
              delta,
            );

            if (camera.position.distanceTo(_targetCamPos) < 0.015) {
              camera.position.copy(_targetCamPos);
              controls.target.copy(_targetLookAt);
              state.camAnimating = false;
            } else {
              keepAnimating = true;
            }
          }

          // Smooth ride height suspension damping
          if (
            state.carRig &&
            Math.abs(state.currentRideOffset - state.targetRideOffset) > 0.0005
          ) {
            state.currentRideOffset = THREE.MathUtils.damp(
              state.currentRideOffset,
              state.targetRideOffset,
              10,
              delta,
            );
            state.carRig.chassisGroup.position.y =
              state.baseGroundClearance + state.currentRideOffset;
            keepAnimating = true;
          }

          // Optional turntable spin
          if (state.autoRotate) {
            state.turntableGroup.rotation.y += delta * 0.35;
            keepAnimating = true;
          }
        }

        const controlsMoved = controls.update();
        if (controlsMoved && !isSoftwareGl) {
          keepAnimating = true;
        }

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || keepAnimating)) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    threeStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      carRig: initialRig,
      turntableGroup,
      isSoftwareGl,
      baseGroundClearance: initialRig.chassisGroup.position.y,
      targetRideOffset: 0,
      currentRideOffset: 0,
      camAnimating: false,
      autoRotate: false,
      requestRender,
    };

    const onControlsStart = () => {
      if (threeStateRef.current) {
        threeStateRef.current.camAnimating = false;
      }
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || disposed) return;
      const w = Math.max(entry.contentRect.width, 320);
      const h = Math.max(entry.contentRect.height, 360);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(mount);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      domEl.removeEventListener('webglcontextlost', onContextLost);
      domEl.removeEventListener('webglcontextrestored', onContextRestored);

      threeStateRef.current?.carRig?.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      podiumGeo.dispose();
      podiumTopMat.dispose();
      podiumSideMat.dispose();
      turntableTex.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (domEl.parentNode === mount) {
        mount.removeChild(domEl);
      }
      threeStateRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild car geometry when vehicle archetype or wheel style changes
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    if (state.carRig) {
      state.turntableGroup.remove(state.carRig.root);
      state.carRig.dispose();
    }

    const nextRig = buildProceduralCar(
      selectedCar.archetype,
      paintColor,
      finish,
      wheelStyle,
    );
    state.baseGroundClearance = nextRig.chassisGroup.position.y;
    nextRig.chassisGroup.position.y =
      state.baseGroundClearance + state.currentRideOffset;
    state.turntableGroup.add(nextRig.root);
    state.carRig = nextRig;
    state.requestRender();
  }, [selectedCar.archetype, wheelStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update paint & finish without rebuilding geometry
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state?.carRig) return;
    const mat = state.carRig.paintMaterial;
    mat.color.set(paintColor);
    mat.metalness = finish === 'metallic' ? 0.72 : 0.25;
    mat.roughness = finish === 'metallic' ? 0.22 : 0.58;
    mat.clearcoat = finish === 'metallic' ? 1.0 : 0.15;
    mat.clearcoatRoughness = finish === 'metallic' ? 0.08 : 0.45;
    mat.needsUpdate = true;
    state.requestRender();
  }, [paintColor, finish]);

  // Update ride height smoothly
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;
    state.targetRideOffset = ((rideHeight - 50) / 50) * 0.09;
    state.requestRender();
  }, [rideHeight]);

  // Update auto-rotate state
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;
    state.autoRotate = autoRotate;
    if (autoRotate) {
      state.requestRender();
    }
  }, [autoRotate]);

  const applyCameraPreset = useCallback((presetId: CameraPresetId) => {
    setActivePreset(presetId);
    const state = threeStateRef.current;
    if (!state) return;
    const preset = CAMERA_PRESETS[presetId];
    _targetCamPos.set(...preset.pos);
    _targetLookAt.set(...preset.target);
    state.camAnimating = true;
    state.requestRender();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      soundSynthRef.current?.dispose();
    };
  }, []);

  const ensureSynth = () => {
    if (!soundSynthRef.current) {
      soundSynthRef.current = new EngineSoundSynthesizer();
    }
    return soundSynthRef.current;
  };

  const handleStartEngine = () => {
    const synth = ensureSynth();
    synth.start(rpm, selectedCar);
    setEngineRunning(true);
    setSoundNote(
      `Synthesizing ${selectedCar.brand} ${selectedCar.model} (${selectedCar.engine}) at ${rpm} RPM.`,
    );
  };

  const handleRevEngine = () => {
    const synth = ensureSynth();
    setEngineRunning(true);
    setSoundNote(
      `Simulating throttle blip on ${selectedCar.brand} ${selectedCar.model}.`,
    );
    synth.blipRev((nextRpm) => {
      setRpm(nextRpm);
    }, selectedCar);
  };

  const handleStopEngine = () => {
    soundSynthRef.current?.stop();
    setEngineRunning(false);
    setSoundNote('Engine audio synthesis stopped.');
  };

  const handleRpmChange = (val: number) => {
    setRpm(val);
    if (engineRunning) {
      soundSynthRef.current?.setRPM(val, selectedCar);
      setSoundNote(
        `Synthesizing ${selectedCar.brand} ${selectedCar.model} at ${val} RPM.`,
      );
    }
  };

  const handleSaveCurrentBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    const label =
      buildName.trim() || `${selectedCar.brand} ${selectedCar.model} Spec`;
    const ok = await onSaveBuild({
      carId: selectedCar.id,
      buildName: label,
      paintColor,
      finish,
      wheelStyle,
      rideHeight,
    });
    if (ok) {
      setBuildName('');
      setActiveTab('builds');
    }
  };

  const handleLoadSavedBuild = (build: SavedStudioBuild) => {
    const targetCar = cars.find((c) => c.id === build.carId);
    if (!targetCar) return;
    if (targetCar.id === selectedCar.id) {
      setPaintColor(build.paintColor);
      setFinish(build.finish);
      setWheelStyle(build.wheelStyle);
      setRideHeight(build.rideHeight);
    } else {
      pendingBuildLoadRef.current = build;
      onSelectCar(targetCar);
    }
  };

  const carsByBrand = useMemo(() => {
    const groups = new Map<string, CarSpec[]>();
    for (const car of cars) {
      const arr = groups.get(car.brand);
      if (arr) {
        arr.push(car);
      } else {
        groups.set(car.brand, [car]);
      }
    }
    return Array.from(groups.entries());
  }, [cars]);

  return (
    <section id="studio" className="py-14 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#d6b45d] mb-2">
              Interactive Showroom
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              3D Customization Studio
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              id="studioCar"
              value={selectedCar.id}
              onChange={(e) => {
                const found = cars.find((c) => c.id === e.target.value);
                if (found) onSelectCar(found);
              }}
              aria-label="Select vehicle for 3D Studio"
              className="h-10 px-3.5 bg-[#12161f] border border-white/12 rounded-lg text-sm text-white focus:outline-none focus:border-[#d6b45d] cursor-pointer"
            >
              {carsByBrand.map(([brand, brandCars]) => (
                <optgroup key={brand} label={`${brand} (${brandCars.length})`}>
                  {brandCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAutoRotate((prev) => !prev)}
              className={`h-10 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                autoRotate
                  ? 'bg-[#d6b45d] text-[#090b10] border-[#d6b45d]'
                  : 'bg-[#12161f] text-[#d1d5df] border-white/12 hover:border-white/25'
              }`}
            >
              {autoRotate ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pause Turntable</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Spin Turntable</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full-Width Unobstructed 3D Viewport with Collapsible Bottom Dock */}
        <div className="relative w-full h-[560px] sm:h-[620px] rounded-xl overflow-hidden border border-white/10 bg-[#0b0f17]">
          {/* Isolated WebGL Mount Container */}
          {!webglLost ? (
            <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-full max-w-md aspect-video overflow-hidden rounded-lg border border-white/10 mb-4">
                <CarImage car={selectedCar} />
              </div>
              <p className="text-sm font-medium text-white">
                WebGL 3D rendering is currently unavailable in this browser context.
              </p>
              <p className="text-xs text-[#a7adba] mt-1">
                Showing studio profile preview for {selectedCar.brand} {selectedCar.model}.
              </p>
            </div>
          )}

          {/* Minimal Top-Left Vehicle Identity Overlay (pointer-events-none except camera strip) */}
          <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-start justify-between gap-3">
            <div className="bg-[#090b10]/88 border border-white/10 rounded-lg px-4 py-2.5">
              <div className="text-xs text-[#d6b45d] font-medium">
                {selectedCar.brand} · {selectedCar.type}
              </div>
              <div className="text-base font-semibold text-white">
                {selectedCar.model}
              </div>
              <div className="text-[11px] text-[#a7adba] font-mono-tabular mt-0.5">
                {selectedCar.hp} HP · {selectedCar.acc} · {selectedCar.top} km/h
              </div>
            </div>

            {/* Camera Angle Presets (top-right, single line, compact) */}
            <div className="pointer-events-auto flex items-center gap-1 bg-[#090b10]/90 border border-white/10 rounded-lg p-1">
              {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyCameraPreset(id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePreset === id
                      ? 'bg-[#d6b45d] text-[#090b10]'
                      : 'text-[#d1d5df] hover:text-white'
                  }`}
                >
                  {CAMERA_PRESETS[id].label}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Bottom Control Dock (No backdrop-filter over WebGL) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-4 w-[min(920px,calc(100%-24px))] transition-transform duration-200 ${
              dockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
            }`}
          >
            {/* Dock Collapse Toggle Handle */}
            <div className="flex justify-center mb-1.5">
              <button
                type="button"
                onClick={() => setDockCollapsed((prev) => !prev)}
                className="px-3.5 py-1 rounded-md bg-[#12161f]/95 border border-white/12 text-[11px] font-medium text-[#d1d5df] hover:text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {dockCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Show Controls (H)</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Hide Controls (H)</span>
                  </>
                )}
              </button>
            </div>

            {/* Dock Body */}
            <div className="bg-[#12161f]/96 border border-white/12 rounded-xl p-4 shadow-2xl">
              {/* Dock Tabs */}
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 mb-3.5 flex-wrap">
                <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-lg border border-white/8 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('finish')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'finish'
                        ? 'bg-[#d6b45d] text-[#090b10]'
                        : 'text-[#a7adba] hover:text-white'
                    }`}
                  >
                    Paint & Finish
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wheels')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'wheels'
                        ? 'bg-[#d6b45d] text-[#090b10]'
                        : 'text-[#a7adba] hover:text-white'
                    }`}
                  >
                    Wheels & Stance
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sound')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'sound'
                        ? 'bg-[#d6b45d] text-[#090b10]'
                        : 'text-[#a7adba] hover:text-white'
                    }`}
                  >
                    Engine Sound
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('builds')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'builds'
                        ? 'bg-[#d6b45d] text-[#090b10]'
                        : 'text-[#a7adba] hover:text-white'
                    }`}
                  >
                    Saved Builds ({savedBuilds.length})
                  </button>
                </div>

                <span className="text-[11px] text-[#8e95a5] hidden sm:inline">
                  Drag to orbit · Scroll to zoom
                </span>
              </div>

              {/* Tab 1: Paint & Finish */}
              {activeTab === 'finish' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-medium text-[#a7adba] mr-1">
                      Exterior Paint
                    </span>
                    {PAINT_SWATCHES.map((swatch) => {
                      const active =
                        paintColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          title={swatch.name}
                          aria-label={`Paint ${swatch.name}`}
                          onClick={() => setPaintColor(swatch.hex)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                            active
                              ? 'border-[#d6b45d] scale-110'
                              : 'border-white/30 hover:border-white'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        />
                      );
                    })}
                    <label className="flex items-center gap-2 ml-1 text-xs text-[#a7adba] cursor-pointer">
                      <span>Custom</span>
                      <input
                        id="paint"
                        type="color"
                        value={paintColor}
                        onChange={(e) => setPaintColor(e.target.value)}
                        aria-label="Custom paint color picker"
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#a7adba]">
                      Surface
                    </span>
                    <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-lg border border-white/8">
                      <button
                        type="button"
                        onClick={() => setFinish('metallic')}
                        className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                          finish === 'metallic'
                            ? 'bg-white/15 text-white'
                            : 'text-[#8e95a5] hover:text-white'
                        }`}
                      >
                        Metallic Clearcoat
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinish('matte')}
                        className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                          finish === 'matte'
                            ? 'bg-white/15 text-white'
                            : 'text-[#8e95a5] hover:text-white'
                        }`}
                      >
                        Satin Matte
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Wheels & Stance */}
              {activeTab === 'wheels' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="wheelStyle"
                      className="text-xs font-medium text-[#a7adba] whitespace-nowrap"
                    >
                      Alloy Wheel Style
                    </label>
                    <select
                      id="wheelStyle"
                      value={wheelStyle}
                      onChange={(e) => setWheelStyle(e.target.value as WheelStyle)}
                      className="flex-1 h-9 px-3 bg-[#0b0e14] border border-white/12 rounded-lg text-xs text-white focus:outline-none focus:border-[#d6b45d] cursor-pointer"
                    >
                      <option value="normal">Standard 6-Spoke Silver</option>
                      <option value="sport">Sport 5-Spoke Gold</option>
                      <option value="luxury">Luxury 10-Spoke Chrome</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="rideHeightRange"
                      className="text-xs font-medium text-[#a7adba] whitespace-nowrap"
                    >
                      Ride Height
                    </label>
                    <input
                      id="rideHeightRange"
                      type="range"
                      min={0}
                      max={100}
                      value={rideHeight}
                      onChange={(e) => setRideHeight(Number(e.target.value))}
                      className="flex-1 accent-[#d6b45d] cursor-pointer"
                    />
                    <span className="text-xs font-mono-tabular text-white w-14 text-right">
                      {rideHeight > 50
                        ? `+${Math.round((rideHeight - 50) * 0.4)} mm`
                        : `${Math.round((rideHeight - 50) * 0.4)} mm`}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 3: Engine Sound Simulation */}
              {activeTab === 'sound' && (
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleStartEngine}
                        className="h-9 px-3.5 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Start Sound</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRevEngine}
                        className="h-9 px-3.5 rounded-lg bg-[#1c2331] border border-white/12 text-white text-xs font-medium hover:border-white/25 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#d6b45d]" aria-hidden="true" />
                        <span>Rev</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopEngine}
                        className="h-9 px-3.5 rounded-lg bg-[#1c2331] border border-white/12 text-[#d1d5df] text-xs font-medium hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Square className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Stop</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 flex-1 max-w-sm">
                      <label
                        htmlFor="rpmSlider"
                        className="text-xs font-medium text-[#a7adba] whitespace-nowrap"
                      >
                        RPM
                      </label>
                      <input
                        id="rpmSlider"
                        type="range"
                        min={800}
                        max={7500}
                        step={50}
                        value={rpm}
                        onChange={(e) => handleRpmChange(Number(e.target.value))}
                        className="flex-1 accent-[#d6b45d] cursor-pointer"
                      />
                      <span className="text-xs font-mono-tabular text-white w-20 text-right">
                        {rpm} RPM
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8e95a5]">{soundNote}</p>
                </div>
              )}

              {/* Tab 4: Saved Builds */}
              {activeTab === 'builds' && (
                <div className="space-y-3">
                  <form
                    onSubmit={handleSaveCurrentBuild}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={buildName}
                      onChange={(e) => setBuildName(e.target.value)}
                      maxLength={80}
                      placeholder={`Name this ${selectedCar.model} configuration...`}
                      aria-label="Configuration build name"
                      className="flex-1 h-9 px-3 bg-[#0b0e14] border border-white/12 rounded-lg text-xs text-white placeholder:text-[#7f8798] focus:outline-none focus:border-[#d6b45d]"
                    />
                    <button
                      type="submit"
                      disabled={savingBuild}
                      className="h-9 px-4 rounded-lg bg-[#d6b45d] text-[#090b10] text-xs font-semibold hover:bg-[#e2c26d] disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{savingBuild ? 'Saving...' : 'Save Current Spec'}</span>
                    </button>
                  </form>

                  {savedBuilds.length === 0 ? (
                    <p className="text-xs text-[#8e95a5]">
                      Save your current paint, finish, wheel style, and ride height to reload it anytime.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {savedBuilds.map((build) => {
                        const car = cars.find((c) => c.id === build.carId);
                        return (
                          <div
                            key={build.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-white/10 shrink-0"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                              style={{ backgroundColor: build.paintColor }}
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              onClick={() => handleLoadSavedBuild(build)}
                              className="text-left cursor-pointer group"
                            >
                              <div className="text-xs font-medium text-white group-hover:text-[#d6b45d] transition-colors whitespace-nowrap">
                                {build.buildName}
                              </div>
                              <div className="text-[10px] text-[#8e95a5] whitespace-nowrap">
                                {car ? `${car.brand} ${car.model}` : build.carId} ·{' '}
                                {build.finish}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteBuild(build.id)}
                              aria-label={`Delete build ${build.buildName}`}
                              className="p-1 text-[#8e95a5] hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
