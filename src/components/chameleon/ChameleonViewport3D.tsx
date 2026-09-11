import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Upload, RotateCcw, Sparkles, BookOpen, Volume2, Eye } from 'lucide-react';
import { ChameleonUrgencyStatus, ChameleonMood } from '../../types';
import { sounds } from '../../services/soundEffects';

interface ChameleonViewport3DProps {
  urgencyStatus?: ChameleonUrgencyStatus;
  mood?: ChameleonMood;
  subjectColorHex?: string;
  onShootTongue?: () => void;
  onPet?: () => void;
  customModelUrl?: string;
  onModelLoaded?: (url: string) => void;
  showControls?: boolean;
  className?: string;
}

export const ChameleonViewport3D: React.FC<ChameleonViewport3DProps> = ({
  urgencyStatus = 'optimal',
  mood = 'happy',
  subjectColorHex = '#10b981',
  onShootTongue,
  onPet,
  customModelUrl,
  onModelLoaded,
  showControls = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Referencias a los componentes procedurales del camaleón
  const chameleonGroupRef = useRef<THREE.Group | null>(null);
  const leftEyePupilRef = useRef<THREE.Mesh | null>(null);
  const rightEyePupilRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const bodyMeshRef = useRef<THREE.Mesh | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const tailGroupRef = useRef<THREE.Group | null>(null);
  const tongueMeshRef = useRef<THREE.Mesh | null>(null);
  const customModelRef = useRef<THREE.Object3D | null>(null);

  // Estados de animación
  const [isTongueShooting, setIsTongueShooting] = useState(false);
  const [isCustomModelActive, setIsCustomModelActive] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color de piel base según el estado de urgencia y asignatura
  const getSkinColor = useCallback(() => {
    if (urgencyStatus === 'dehydrated') {
      return new THREE.Color('#7a583d'); // Café opaco deshidratado
    }
    if (urgencyStatus === 'predator_attack') {
      return new THREE.Color('#e11d48'); // Rojo alerta de peligro
    }
    if (urgencyStatus === 'pale') {
      return new THREE.Color('#94a3b8'); // Gris pálido enfermo
    }
    // Óptimo: usa el color de la asignatura activa o verde esmeralda
    return new THREE.Color(subjectColorHex || '#10b981');
  }, [urgencyStatus, subjectColorHex]);

  // Actualizar el color de los materiales del camaleón en tiempo real
  useEffect(() => {
    const targetColor = getSkinColor();
    if (bodyMeshRef.current && (bodyMeshRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = bodyMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.copy(targetColor);
      mat.roughness = urgencyStatus === 'dehydrated' ? 0.9 : urgencyStatus === 'pale' ? 0.8 : 0.35;
      mat.metalness = urgencyStatus === 'optimal' ? 0.15 : 0.05;
    }
    if (headMeshRef.current && (headMeshRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = headMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.copy(targetColor);
    }
    if (tailGroupRef.current) {
      tailGroupRef.current.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.copy(targetColor);
        }
      });
    }
  }, [getSkinColor, urgencyStatus]);

  // Construcción de la escena Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 300;

    // 1. Escena, Cámara y Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 3.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Iluminación Dinámica
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8e7, 2.0);
    keyLight.position.set(2.5, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    fillLight.position.set(-2.5, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.4);
    rimLight.position.set(0, -2, -3);
    scene.add(rimLight);

    // 3. Suelo Diorama Flotante (Plataforma musgosa circular)
    const platformGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.25, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -1.15;
    platform.receiveShadow = true;
    scene.add(platform);

    // Capa de musgo sobre la plataforma
    const mossGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.05, 32);
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.9,
    });
    const moss = new THREE.Mesh(mossGeo, mossMat);
    moss.position.y = -1.02;
    scene.add(moss);

    // Partículas flotantes de rocío ambiental
    const dewParticlesCount = 28;
    const dewGeo = new THREE.BufferGeometry();
    const dewPos = new Float32Array(dewParticlesCount * 3);
    for (let i = 0; i < dewParticlesCount; i++) {
      dewPos[i * 3] = (Math.random() - 0.5) * 3;
      dewPos[i * 3 + 1] = Math.random() * 2.5 - 0.8;
      dewPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    dewGeo.setAttribute('position', new THREE.BufferAttribute(dewPos, 3));
    const dewMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const dewParticles = new THREE.Points(dewGeo, dewMat);
    scene.add(dewParticles);

    // 4. GRUPO PRINCIPAL DEL CAMALEÓN 3D
    const chameleonGroup = new THREE.Group();
    chameleonGroupRef.current = chameleonGroup;
    chameleonGroup.position.set(0, -0.4, 0);
    scene.add(chameleonGroup);

    // Material de Piel Inicial
    const skinMat = new THREE.MeshStandardMaterial({
      color: getSkinColor(),
      roughness: 0.4,
      metalness: 0.1,
    });

    // CUERPO (Gordito, curvado, estilizado)
    const bodyGeo = new THREE.SphereGeometry(0.65, 32, 24);
    bodyGeo.scale(0.9, 1.1, 1.0);
    const body = new THREE.Mesh(bodyGeo, skinMat);
    body.position.set(0, 0, 0);
    body.castShadow = true;
    chameleonGroup.add(body);
    bodyMeshRef.current = body;

    // Vientre más claro
    const bellyGeo = new THREE.SphereGeometry(0.58, 24, 16);
    bellyGeo.scale(0.8, 0.95, 0.5);
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.6,
    });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.08, 0.4);
    chameleonGroup.add(belly);

    // Cresta dorsal
    const crestGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const coneGeo = new THREE.ConeGeometry(0.08 - i * 0.01, 0.14, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.4,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(0, 0.65 - i * 0.14, -0.35 + i * 0.12);
      cone.rotation.x = -Math.PI / 4 + i * 0.15;
      crestGroup.add(cone);
    }
    chameleonGroup.add(crestGroup);

    // CABEZA
    const headGeo = new THREE.SphereGeometry(0.5, 32, 24);
    headGeo.scale(1.05, 0.95, 1.1);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.75, 0.2);
    head.castShadow = true;
    chameleonGroup.add(head);
    headMeshRef.current = head;

    // Casco / Cresta de la cabeza
    const casqueGeo = new THREE.ConeGeometry(0.24, 0.4, 16);
    const casque = new THREE.Mesh(casqueGeo, skinMat);
    casque.position.set(0, 1.1, -0.05);
    casque.rotation.x = -0.4;
    chameleonGroup.add(casque);

    // Hocico / Boca sonriente
    const snoutGeo = new THREE.SphereGeometry(0.26, 16, 16);
    snoutGeo.scale(1, 0.6, 1.2);
    const snout = new THREE.Mesh(snoutGeo, skinMat);
    snout.position.set(0, 0.62, 0.6);
    chameleonGroup.add(snout);

    // OJOS GLOBULARES 360° INDEPENDIENTES (Característica icónica del camaleón)
    const eyeBaseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: getSkinColor(),
      roughness: 0.4,
      side: THREE.DoubleSide,
    });

    // Ojo Izquierdo
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.45, 0.85, 0.4);
    chameleonGroup.add(leftEyeGroup);

    const leftGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), eyeBaseMat);
    leftEyeGroup.add(leftGlobe);

    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), pupilMat);
    leftPupil.position.set(0, 0, 0.16);
    leftEyeGroup.add(leftPupil);
    leftEyePupilRef.current = leftPupil;

    const leftEyelid = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      eyelidMat
    );
    leftEyelid.rotation.x = Math.PI / 2;
    leftEyelid.scale.set(1, 1, 0.05);
    leftEyeGroup.add(leftEyelid);
    leftEyelidRef.current = leftEyelid;

    // Ojo Derecho
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.45, 0.85, 0.4);
    chameleonGroup.add(rightEyeGroup);

    const rightGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), eyeBaseMat);
    rightEyeGroup.add(rightGlobe);

    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), pupilMat);
    rightPupil.position.set(0, 0, 0.16);
    rightEyeGroup.add(rightPupil);
    rightEyePupilRef.current = rightPupil;

    const rightEyelid = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      eyelidMat
    );
    rightEyelid.rotation.x = Math.PI / 2;
    rightEyelid.scale.set(1, 1, 0.05);
    rightEyeGroup.add(rightEyelid);
    rightEyelidRef.current = rightEyelid;

    // COLA EN ESPIRAL (3D Torus)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.2, -0.6);
    tailGroupRef.current = tailGroup;
    chameleonGroup.add(tailGroup);

    const tailCurveGeo = new THREE.TorusGeometry(0.35, 0.11, 16, 32, Math.PI * 1.5);
    const tailMesh = new THREE.Mesh(tailCurveGeo, skinMat);
    tailMesh.rotation.y = Math.PI / 2;
    tailMesh.rotation.x = -0.4;
    tailGroup.add(tailMesh);

    // LENGUA RETRÁCTIL (Oculta por defecto en la boca)
    const tongueGeo = new THREE.CylinderGeometry(0.04, 0.07, 1.8, 16);
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.3,
      metalness: 0.1,
    });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.rotation.x = Math.PI / 2;
    tongue.position.set(0, 0.6, 0.7);
    tongue.scale.set(0.01, 0.01, 0.01); // Retraída
    chameleonGroup.add(tongue);
    tongueMeshRef.current = tongue;

    // LIBRO DE ESTUDIO ABIERTO EN MANO IZQUIERDA (Exacto al modelo de Tripo3D del usuario)
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-0.55, 0.15, 0.55);
    bookGroup.rotation.set(0.3, 0.4, -0.2);
    chameleonGroup.add(bookGroup);

    // Cubierta del libro (Verde bosque dyser)
    const coverGeo = new THREE.BoxGeometry(0.55, 0.04, 0.42);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.5,
    });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    bookGroup.add(cover);

    // Páginas blancas del libro
    const pagesGeo = new THREE.BoxGeometry(0.5, 0.06, 0.38);
    const pagesMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
    });
    const pages = new THREE.Mesh(pagesGeo, pagesMat);
    pages.position.y = 0.04;
    bookGroup.add(pages);

    // Brazo izquierdo sosteniendo el libro
    const leftArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.4, 12);
    const leftArm = new THREE.Mesh(leftArmGeo, skinMat);
    leftArm.position.set(-0.48, 0.12, 0.25);
    leftArm.rotation.set(0.8, -0.4, 0.6);
    chameleonGroup.add(leftArm);

    // Brazo derecho saludando alegremente
    const rightArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 12);
    const rightArm = new THREE.Mesh(rightArmGeo, skinMat);
    rightArm.position.set(0.55, 0.35, 0.3);
    rightArm.rotation.set(-0.4, 0.3, -1.1);
    chameleonGroup.add(rightArm);

    // Mano derecha con deditos
    const handGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.72, 0.55, 0.25);
    chameleonGroup.add(rightHand);

    // Patitas inferiores fijas sobre la plataforma
    const footGeo = new THREE.SphereGeometry(0.12, 12, 12);
    footGeo.scale(1.2, 0.6, 1.4);
    const leftFoot = new THREE.Mesh(footGeo, skinMat);
    leftFoot.position.set(-0.35, -0.65, 0.2);
    chameleonGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, skinMat);
    rightFoot.position.set(0.35, -0.65, 0.2);
    chameleonGroup.add(rightFoot);

    // 5. CICLO DE ANIMACIÓN PRINCIPAL
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // RESPIRACIÓN (Inactividad Idle estilo Duolingo)
      const breathRate = urgencyStatus === 'pale' ? 1.2 : 2.6;
      const breathAmp = urgencyStatus === 'pale' ? 0.015 : 0.035;
      const breathScale = 1.0 + Math.sin(elapsedTime * breathRate) * breathAmp;
      body.scale.set(0.9 * breathScale, 1.1 * breathScale, 1.0 * breathScale);

      // BALANCEO DEL CUERPO (Idle sway)
      const sway = Math.sin(elapsedTime * 1.5) * 0.05;
      chameleonGroup.rotation.y = sway + mousePosRef.current.x * 0.3;
      chameleonGroup.rotation.x = mousePosRef.current.y * 0.15;

      // MOVIMIENTO LEVE DE COLA
      if (tailGroupRef.current) {
        tailGroupRef.current.rotation.z = Math.sin(elapsedTime * 2.2) * 0.1;
      }

      // BRAZO DERECHO SALUDANDO SUAVEMENTE
      rightArm.rotation.z = -1.1 + Math.sin(elapsedTime * 3.5) * 0.18;

      // MOVIMIENTO INDEPENDIENTE DE OJOS 360° (Visión camaleón)
      if (leftEyePupilRef.current && rightEyePupilRef.current) {
        // Ojo izquierdo: mira al cursor
        leftEyePupilRef.current.position.x = mousePosRef.current.x * 0.07;
        leftEyePupilRef.current.position.y = mousePosRef.current.y * 0.07;

        // Ojo derecho: movimiento autónomo exploratorio (mira arriba/costados)
        rightEyePupilRef.current.position.x = Math.sin(elapsedTime * 1.2) * 0.06;
        rightEyePupilRef.current.position.y = Math.cos(elapsedTime * 1.7) * 0.05;
      }

      // PARTICULAS DE ROCÍO FLOTANDO
      dewParticles.rotation.y = elapsedTime * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [getSkinColor, urgencyStatus]);

  // Carga opcional de modelo 3D GLTF / GLB si el usuario lo importa
  useEffect(() => {
    if (!customModelUrl || !sceneRef.current) return;

    const loader = new GLTFLoader();
    loader.load(
      customModelUrl,
      gltf => {
        if (!sceneRef.current) return;
        // Ocultar modelo procedural temporalmente
        if (chameleonGroupRef.current) {
          chameleonGroupRef.current.visible = false;
        }
        // Remover modelo anterior si existía
        if (customModelRef.current) {
          sceneRef.current.remove(customModelRef.current);
        }

        const model = gltf.scene;
        // Ajustar escala y posición
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / maxDim;
        model.scale.set(scale, scale, scale);
        model.position.set(0, -0.5, 0);

        sceneRef.current.add(model);
        customModelRef.current = model;
        setIsCustomModelActive(true);
        setModelLoadingError(null);
      },
      undefined,
      err => {
        console.warn('Error al cargar GLTF personalizado:', err);
        setModelLoadingError('No se pudo cargar el archivo 3D. Mostrando motor procedural.');
        if (chameleonGroupRef.current) {
          chameleonGroupRef.current.visible = true;
        }
      }
    );
  }, [customModelUrl]);

  // Ciclo de pestañeo natural independiente
  useEffect(() => {
    const interval = setInterval(() => {
      // Pestañeo rápido
      if (leftEyelidRef.current && rightEyelidRef.current) {
        leftEyelidRef.current.scale.z = 1;
        rightEyelidRef.current.scale.z = 1;
        setTimeout(() => {
          if (leftEyelidRef.current && rightEyelidRef.current) {
            leftEyelidRef.current.scale.z = 0.05;
            rightEyelidRef.current.scale.z = 0.05;
          }
        }, 140);
      }
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  // Función de disparo de lengua retráctil (Reacción al acertar / ganar gotas)
  const shootTongue = useCallback(() => {
    if (isTongueShooting || !tongueMeshRef.current) return;
    setIsTongueShooting(true);
    sounds.playTongueSnap();

    const tongue = tongueMeshRef.current;
    // Extender lengua hacia adelante a toda velocidad
    tongue.scale.set(1, 1.8, 1);
    tongue.position.z = 1.4;

    setTimeout(() => {
      sounds.playDewDrop();
      // Retraer lengua
      tongue.scale.set(0.01, 0.01, 0.01);
      tongue.position.z = 0.7;
      setIsTongueShooting(false);
      if (onShootTongue) onShootTongue();
    }, 280);
  }, [isTongueShooting, onShootTongue]);

  // Mouse Move Tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x, y };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x, y };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (onModelLoaded) {
      onModelLoaded(url);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none rounded-3xl group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mousePosRef.current = { x: 0, y: 0 };
      }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Canvas 3D de Three.js */}
      <div
        ref={containerRef}
        onClick={() => {
          shootTongue();
          if (onPet) onPet();
        }}
        className="w-full h-64 sm:h-72 cursor-pointer flex items-center justify-center transition-transform duration-300 group-active:scale-98"
        title="Toca al camaleón para acariciarlo o disparar su lengua retráctil"
      />

      {/* Indicador de Visión 360° e Interactividad */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white shadow-xs pointer-events-none">
        <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Visión 360° Activa</span>
      </div>

      {/* Botones de Control de la Mascota 3D */}
      {showControls && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
          {/* Botón Disparo de Lengua */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              shootTongue();
            }}
            className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-700 text-rose-600 dark:text-rose-400 hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer"
            title="Disparar lengua retráctil para atrapar rocío"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Selector para importar modelo 3D GLB/GLTF de Tripo3D */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer"
            title="Importar modelo 3D (.glb / .gltf) desde Tripo3D"
          >
            <Upload className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Alerta si hubo error al cargar modelo externo */}
      {modelLoadingError && (
        <div className="absolute bottom-3 left-3 z-10 text-[10px] text-rose-300 bg-black/70 px-2 py-1 rounded-lg backdrop-blur-xs">
          {modelLoadingError}
        </div>
      )}
    </div>
  );
};
