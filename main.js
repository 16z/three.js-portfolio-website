import * as THREE from 'three';

// Get the canvas element
const canvas = document.getElementById('canvas');

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f172a');

// Create camera with wider field of view
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

// Create renderer with better shadows
const renderer = new THREE.WebGLRenderer({ 
  canvas: canvas, 
  antialias: true,
  alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000;
const positionArray = new Float32Array(particlesCount * 3);
const scaleArray = new Float32Array(particlesCount);

// Fill particles with random positions
for (let i = 0; i < particlesCount * 3; i++) {
  positionArray[i] = (Math.random() - 0.5) * 30;
}

// Random sizes
for (let i = 0; i < particlesCount; i++) {
  scaleArray[i] = Math.random();
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));

// Create a custom shader material for particles
const particlesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#2D4263') }
  },
  vertexShader: `
    attribute float scale;
    uniform float uTime;
    
    void main() {
      vec3 pos = position;
      
      // Slow oscillation based on position and time
      pos.y += sin(pos.x * 0.5 + uTime * 0.2) * 0.5;
      pos.x += cos(pos.z * 0.5 + uTime * 0.2) * 0.5;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = scale * 2.0 * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    
    void main() {
      // Create a circle with smooth edges
      float strength = distance(gl_PointCoord, vec2(0.5));
      strength = 1.0 - strength;
      strength = pow(strength, 3.0);
      
      // Final color
      vec3 color = mix(vec3(0.0), uColor, strength);
      gl_FragColor = vec4(color, strength);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

// Create particles points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Create main floating object (more complex geometry)
const mainGeometry = new THREE.IcosahedronGeometry(2, 1);
const mainMaterial = new THREE.MeshPhysicalMaterial({
  color: '#C84B31',
  metalness: 0.3,
  roughness: 0.4,
  clearcoat: 0.5,
  clearcoatRoughness: 0.2,
  wireframe: false
});
const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
scene.add(mainMesh);

// Create smaller floating objects
const smallObjectsGroup = new THREE.Group();
scene.add(smallObjectsGroup);

// Create 5 smaller objects with different geometries
const geometries = [
  new THREE.TorusGeometry(0.7, 0.2, 16, 100),
  new THREE.OctahedronGeometry(0.8, 0),
  new THREE.TetrahedronGeometry(0.8, 0),
  new THREE.DodecahedronGeometry(0.7, 0),
  new THREE.TorusKnotGeometry(0.6, 0.15, 100, 16)
];

for (let i = 0; i < 5; i++) {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#ECDBBA',
    metalness: 0.1,
    roughness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
  });
  
  const mesh = new THREE.Mesh(geometries[i], material);
  
  // Position objects in a circular pattern
  const angle = (i / 5) * Math.PI * 2;
  const radius = 5;
  mesh.position.x = Math.cos(angle) * radius;
  mesh.position.z = Math.sin(angle) * radius;
  mesh.position.y = (Math.random() - 0.5) * 4;
  
  // Add random rotation
  mesh.rotation.x = Math.random() * Math.PI;
  mesh.rotation.y = Math.random() * Math.PI;
  
  smallObjectsGroup.add(mesh);
}

// Add lights
const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight('#ffffff', 0.5);
scene.add(ambientLight);

// Add point lights with different colors
const pointLight1 = new THREE.PointLight('#ff7700', 1, 20);
pointLight1.position.set(2, 3, 4);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight('#0077ff', 1, 20);
pointLight2.position.set(-5, 0, -5);
scene.add(pointLight2);

// Handle mousemove for interactive effect
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Handle scroll for parallax effect
// let scrollY = window.scrollY;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  requestAnimationFrame(animate);
  
  const elapsedTime = clock.getElapsedTime();
  
  // Update particle shader time
  particlesMaterial.uniforms.uTime.value = elapsedTime;
  
  // Rotate main object
  mainMesh.rotation.y = elapsedTime * 0.2;
  mainMesh.rotation.z = elapsedTime * 0.1;
  
  // Rotate and move small objects
  smallObjectsGroup.children.forEach((child, i) => {
    child.rotation.x += 0.003;
    child.rotation.y += 0.005;
    
    // Make them float up and down slightly
    child.position.y += Math.sin(elapsedTime * 0.5 + i) * 0.005;
  });
  
  // Smooth camera movement based on mouse position
  targetX = mouseX * 0.3;
    targetY = mouseY * 0.3;
    
    // Update camera position based on mouse movement
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    // Render the scene
    renderer.render(scene, camera);
  }