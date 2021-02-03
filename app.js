import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import { WEBGL } from "./builds/WebGL.js";
// Check Browser Compatibility
if (WEBGL.isWebGLAvailable() === false) {
  document.body.appendChild(WEBGL.getWebGLErrorMessage());
}

// HTML Elements
const container = document.getElementById("container");

// Scene Setup Variables
var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  renderer,
  HEIGHT,
  WIDTH;
// Scene Light Variables
var directionalLight,
  ambientLight,
  pointLight1,
  pointLight2,
  pointLight3,
  pointLight4,
  pointLight5;

var clock;

// Animation Variables
var mixer;

// Sound Variables
var sound, listener;

// Controllers
var airplaneControl;

// Active Scene Objects
var cube, plane, groundPlane, billboard;
var rings = [];
var trees = [];
var rocks = [];
var cloud = [];

// Physical World
let physicsWorld, tmpTrans;
let rigidBodies = [];

var Colors = {
  red: 0xf25346,
  white: 0xffffff,
  softwhite: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
  lightBlue: 0x7ad7f0,
  desertBrown: 0xe5d3b3,
  black: 0x000000,
  fog_color: 0xdcdbdf,
};

// Enable Debugging with camera movement
var debug = false;
var fog = true;

//Ammojs Initialization
Ammo().then(init);

/**
 * Parent function that instantiates all objects on load
 */
function init() {
  tmpTrans = new Ammo.btTransform();

  // Ammo.js Functions
  setupPhysicsWorld();

  createScene();
  createObjects();
  createLights();
  createAudio();

  // KeyPress Listener
  document.body.addEventListener("keydown", onKeyDown, false);
}

/**
 * Create ammo.js physical world settings
 */
function setupPhysicsWorld() {
  let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
    overlappingPairCache = new Ammo.btDbvtBroadphase(),
    solver = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

var spawnClouds = setInterval(function () {
  var c = createCloud();
}, 1200);

/**
 * Instantiates all Scene related objects
 */
function createScene() {
  // Set window dimensions
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // Create clock for timing
  clock = new THREE.Clock();

  // Scene Object
  scene = new THREE.Scene();
  scene.background = new THREE.Color(Colors.desertBrown);

  // Scene Fog Settings
  if (fog) {
    const near = 20;
    const far = 200;
    const color = Colors.desertBrown;
    scene.fog = new THREE.Fog(color, near, far);
  }

  // Create the camera
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 75;
  nearPlane = 0.1;
  farPlane = 1000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.set(0, 10, 15);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  // Scene renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.GammaEncoding;
  container.appendChild(renderer.domElement);

  // Handle Window Resize
  window.addEventListener("resize", handleWindowResize, false);
}

/**
 * Handles window resizing and updates camera projMtx
 */
function handleWindowResize() {
  // Update height and width of the renderer and the camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

/**
 * Handles creation of audio in the scene
 */
function createAudio() {
  // Create Audio listener bound to camera and audio source
  listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.PositionalAudio(listener);
  // load a sound and set it as the Audio object's buffer
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("sounds/plane.ogg", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.setRefDistance(20);
    //sound.play();
  });
}

/**
 * Handles creation of all light sources
 */
function createLights() {
  // Directional Light Object in Scene
  const dirIntensity = 0.72;
  directionalLight = new THREE.DirectionalLight(Colors.softwhite, dirIntensity);
  directionalLight.position.set(20, 100, 1);

  directionalLight.castShadow = true;

  // Define shadow resolution
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;

  let d = 100;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  directionalLight.shadow.camera.far = 13500;

  if (debug) {
    var camHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    scene.add(camHelper);
  }

  // Ambient Light Object in Scene
  const ambientIntensity = 0.5;
  ambientLight = new THREE.AmbientLight(Colors.softwhite, ambientIntensity);

  // Point Light Objects in Scene
  const pointIntensity = 0.1;
  pointLight1 = new THREE.PointLight(Colors.red, pointIntensity, 50, 2);
  pointLight1.position.set(0, 20, 0);

  pointLight2 = new THREE.PointLight(Colors.red, pointIntensity, 50, 2);
  pointLight2.position.set(0, 20, -15);

  pointLight3 = new THREE.PointLight(Colors.red, pointIntensity, 50, 2);
  pointLight3.position.set(0, 20, -30);

  pointLight4 = new THREE.PointLight(Colors.red, pointIntensity, 50, 2);
  pointLight4.position.set(0, 20, -45);

  pointLight5 = new THREE.PointLight(Colors.red, pointIntensity, 50, 2);
  pointLight5.position.set(0, 20, -60);

  // Add all light sources to the Scene
  scene.add(directionalLight);
  scene.add(ambientLight);
  scene.add(pointLight1);
  scene.add(pointLight2);
  scene.add(pointLight3);
  scene.add(pointLight4);
  scene.add(pointLight5);
}

/**
 * Parent Function for Creating Objects for Scene
 */
function createObjects() {
  //createTest();
  //createCube();
  createAirplane();
  createBillboards();
  createRings();
  createTrees();
  createRocks();
  createRamp();
  createColumns();
  createGitHubCat();
  createLinkedIn();
  createMailbox();
  createKeys();
  createHanger();

  createGroundPlane();
  createNameText();

  var message = `Online Private Instructor\n
    Instructed over 100 lessons to K-12 students on Python, Java, Scratch, and JavaScript\n
    Designed unique curriculums to accommodate students’ individual needs and interests\n
    Leveraged knowledge in Full Stack Development to help students deploy web applications and games`;

  createExperienceText(message, 1);

  message = `Software Engineer Intern \n
    UpperLine Code\n\n
    Developed computer science projects using JavaScript, HTML and CSS designed for student education\n
    Maintained Git repo and Amazon Web Services for building and debugging course exercises`;

  createExperienceText(message, 2);

  message = `SortingVisualizer\n
    JavaScript Web Application\n\n
    Developed a web application using JavaScript, HTML, CSS to visually sort data using various sorting algorithms\n
    Implemented Merge Sort, Insertion Sort, Bubble Sort, Selection Sort\n
    Integrated a code executor using Sphere Engine’s Compiler API to enable users to practice sorting algorithms`;

  createExperienceText(message, 3);

  message = `Clubhouse Dungeons\n
    Google Chrome Extension\n\n
    Platform that enables agile software teams to manage team member productivity and Clubhouse data\n
    Implemented the backend code and Clubhouse REST API integrations for maintaining user data using JavaScript\n
    Built an automated CI/CD pipeline in GitHub Actions for JSDocs documentation and Jest unit tests\n
    Led scrum meetings and team retrospectives with a team of 13`;

  createExperienceText(message, 4);

  message =
    "USE YOUR                                        KEYS\n\n\n                TO MOVE AROUND";

  createExperienceText(message, -1.8);
}

function createTest() {
  let pos = { x: 0, y: 2, z: 35.5 };
  let scale = { x: 4.5, y: 1, z: 3 };
  let quat = { x: 0, y: 0, z: 0, w: 1 };
  let mass = 1;
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshPhongMaterial({ color: Colors.red });
  cube = new THREE.Mesh(geometry, material);
  cube.scale.set(scale.x, scale.y, scale.z);
  scene.add(cube);

  // //Ammojs Section

  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  let motionState = new Ammo.btDefaultMotionState(transform);

  let colShape = new Ammo.btBoxShape(
    new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
  );
  colShape.setMargin(0.05);

  let localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia
  );
  let body = new Ammo.btRigidBody(rbInfo);

  physicsWorld.addRigidBody(body);

  cube.userData.physicsBody = body;
  rigidBodies.push(cube);
}

/**
 * Creates Controlled Cube Player as Default on start
 */
function createCube() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshLambertMaterial({ color: Colors.brown });
  cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 2, 5);
  if (debug) {
    cube.castShadow = true;
    scene.add(cube);
  }
  plane = cube;
}
/**
 * Creates Ground Plane
 */
function createGroundPlane() {
  let pos = { x: 0, y: -1, z: 0 };
  let scale = { x: 2000, y: 2, z: 2000 };
  let quat = { x: 0, y: 0, z: 0, w: 1 };
  let mass = 0;

  const geometry = new THREE.BoxBufferGeometry();
  const material = new THREE.MeshPhongMaterial({
    color: Colors.desertBrown,
    side: THREE.DoubleSide,
  });
  groundPlane = new THREE.Mesh(geometry, material);

  groundPlane.scale.set(scale.x, scale.y, scale.z);
  groundPlane.position.set(pos.x, pos.y, pos.z);

  groundPlane.receiveShadow = true;

  scene.add(groundPlane);

  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  let motionState = new Ammo.btDefaultMotionState(transform);

  let colShape = new Ammo.btBoxShape(
    new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
  );
  colShape.setMargin(0.05);

  let localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia
  );
  let body = new Ammo.btRigidBody(rbInfo);

  physicsWorld.addRigidBody(body);
}

/**
 * Creates Shadowed Name 3D text in Scene
 */
function createNameText() {
  const loader = new THREE.FontLoader();
  loader.load("fonts/helvetiker_regular.typeface.json", function (font) {
    const color = Colors.black;

    // Lined Text
    const matDark = new THREE.LineBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
    });

    // Shadow Text
    const matLite = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    // Create a set of Shapes representing a font loaded in JSON format.
    const message = "Jason Lin";
    const textSize = 3;
    const shapes = font.generateShapes(message, textSize);

    // Creates an one-sided polygonal geometry from one or more path shapes.
    const geometry = new THREE.ShapeBufferGeometry(shapes);

    // Compute Bounding Box for bufferGeometry of text
    geometry.computeBoundingBox();

    // Position Text to center in Scene
    const xMid =
      -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 1, 0);

    // make shape ( N.B. edge view not visible )

    const text = new THREE.Mesh(geometry, matLite);
    text.position.z = -2;
    scene.add(text);

    // make line shape ( N.B. edge view remains visible )

    const holeShapes = [];

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];

      if (shape.holes && shape.holes.length > 0) {
        for (let j = 0; j < shape.holes.length; j++) {
          const hole = shape.holes[j];
          holeShapes.push(hole);
        }
      }
    }

    shapes.push.apply(shapes, holeShapes);

    const lineText = new THREE.Object3D();

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];

      const points = shape.getPoints();
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      geometry.translate(xMid, 1, 0);

      const lineMesh = new THREE.Line(geometry, matDark);
      lineText.add(lineMesh);
    }

    scene.add(lineText);
  }); //end load function
}

function createExperienceText(message, offset) {
  const loader = new THREE.FontLoader();
  loader.load("fonts/helvetiker_regular.typeface.json", function (font) {
    const color = Colors.black;

    // Solid Text
    const matLite = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    const textSize = 0.6;
    const shapes = font.generateShapes(message, textSize);

    const geometry = new THREE.ShapeBufferGeometry(shapes);

    geometry.computeBoundingBox();

    // Center text
    const xMid =
      -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 0, 0);

    const text = new THREE.Mesh(geometry, matLite);

    // Rotate to match plane, translate
    text.rotation.x = -Math.PI / 2;
    text.position.set(0, 0.01, -15 * offset);

    scene.add(text);
  }); //end load function
}

/**
 * Loads GLTF/GLB airplane files from Blender
 */
function createAirplane() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("airplane.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Load Propeller Spin Animation with Mixer
    mixer = new THREE.AnimationMixer(gltf.scene);
    var action = mixer.clipAction(gltf.animations[1]);
    action.play();

    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    plane = gltf.scene.children[0];
    scene.add(plane);
    plane.position.set(0, 1, 35);

    airplaneControl = new THREE.PlayerControls(plane);

    // let pos = { x: 0, y: 2, z: 35.5 };
    // let scale = { x: 4.5, y: 1, z: 3 };
    // let quat = { x: 0, y: 0, z: 0, w: 1 };
    // let mass = 0.1;

    // // //Ammojs Section

    // let transform = new Ammo.btTransform();
    // transform.setIdentity();
    // transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    // transform.setRotation(
    //   new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    // );
    // let motionState = new Ammo.btDefaultMotionState(transform);

    // let colShape = new Ammo.btBoxShape(
    //   new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    // );
    // colShape.setMargin(0.05);

    // let localInertia = new Ammo.btVector3(0, 0, 0);
    // colShape.calculateLocalInertia(mass, localInertia);

    // let rbInfo = new Ammo.btRigidBodyConstructionInfo(
    //   mass,
    //   motionState,
    //   colShape,
    //   localInertia
    // );
    // let body = new Ammo.btRigidBody(rbInfo);
    // body.setFriction(4);
    // body.setRollingFriction(10);

    // physicsWorld.addRigidBody(body);

    // plane.userData.physicsBody = body;
    // rigidBodies.push(plane);

    // Begin Animation
    animate();
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB billboard files from Blender
 */
function createBillboards() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("billboard2.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    let pos = { x: -34, y: 12, z: -31.7 };
    let scale = { x: 14, y: 15, z: 1 };
    let quat = { x: 0, y: 0.14, z: 0, w: 1 };
    let mass = 1;

    // Get scene child from file
    billboard = gltf.scene.children[0];

    var pointIntensity = 0.8;
    var billboardPointLight1 = new THREE.PointLight(
      Colors.white,
      pointIntensity,
      10,
      2
    );
    billboardPointLight1.position.set(-21, 10, -27);

    var billboardPointLight2 = new THREE.PointLight(
      Colors.white,
      pointIntensity,
      9,
      2
    );
    billboardPointLight2.position.set(-25, 10, -27);

    var billboardPointLight3 = new THREE.PointLight(
      Colors.white,
      pointIntensity,
      10,
      2
    );
    billboardPointLight3.position.set(-29, 10, -27);

    billboardPointLight1.parent = billboard;
    billboardPointLight2.parent = billboard;
    billboardPointLight3.parent = billboard;
    billboard.position.set(pos.x, pos.y, pos.z);

    scene.add(billboard);
    scene.add(billboardPointLight1);
    scene.add(billboardPointLight2);
    scene.add(billboardPointLight3);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.55, scale.z * 0.5)
    );
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(body);

    billboard.userData.physicsBody = body;
    rigidBodies.push(billboard);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ring files from Blender
 */
function createRings() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("ring.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    for (let i = 0; i < 5; i++) {
      var ring = gltf.scene.children[0].clone();
      rings.push(ring);
      scene.add(rings[i]);
    }

    rings[0].position.set(10, 10, -30);
    rings[1].position.set(-5, 10, -60);
    rings[2].position.set(5, 10, -90);
    rings[3].position.set(-5, 10, -120);
    rings[4].position.set(5, 10, -140);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ring files from Blender
 */
function createTrees() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("lowpoly_tree.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    var positions = [
      { x: 25, y: 8, z: -30 },
      { x: -25, y: 10, z: -60 },
      { x: 25, y: 12, z: -90 },
      { x: -25, y: 14, z: -120 },
      { x: 25, y: 16, z: -150 },
    ];

    // Get scene child from file
    for (let i = 0; i < 5; i++) {
      var tree = gltf.scene.children[0].clone();
      trees.push(tree);
      scene.add(trees[i]);
      trees[i].position.set(positions[i].x, positions[i].y, positions[i].z);

      let pos = positions[i];
      let scale = { x: 9, y: 12.5, z: 9 };
      let quat = { x: 0, y: 0, z: 0, w: 1 };
      let mass = 1;

      // //Ammojs Section

      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      let motionState = new Ammo.btDefaultMotionState(transform);

      let colShape = new Ammo.btBoxShape(
        new Ammo.btVector3(scale.x * 0.5, scale.y * 0.4, scale.z * 0.5)
      );
      colShape.setMargin(0.05);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rbInfo);

      physicsWorld.addRigidBody(body);

      trees[i].userData.physicsBody = body;
      rigidBodies.push(trees[i]);
    }
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB rocks files from Blender
 */
function createRocks() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("lowpoly_rock.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    for (let i = 0; i < 5; i++) {
      var rock = gltf.scene.children[0].clone();
      rocks.push(rock);
      scene.add(rocks[i]);
    }

    rocks[0].position.set(12, 0.2, 0);
    rocks[1].position.set(-25, 0.2, -20);
    rocks[2].position.set(30, 0.2, -23);
    rocks[3].position.set(-37, 0.2, -50);
    rocks[4].position.set(-10, 0.2, 15);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createRamp() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("ramp.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var ramp = gltf.scene.children[0];

    ramp.position.set(0, 0, 10);

    scene.add(ramp);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createColumns() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("columns.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var columns = gltf.scene.children[0];

    columns.position.set(0, 0, -150);

    scene.add(columns);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createGitHubCat() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("githubcat.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var cat = gltf.scene.children[0];

    cat.position.set(0, 11.5, -150);

    scene.add(cat);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createLinkedIn() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("linkedin.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var cat = gltf.scene.children[0];

    cat.position.set(-6.1, 12.8, -150);

    scene.add(cat);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

function createCloud() {
  // Create an empty container that will hold the different parts of the cloud
  var mesh = new THREE.Object3D();
  // create a cube geometry;
  // this shape will be duplicated to create the cloud
  var geom = new THREE.BoxGeometry(20, 20, 20);

  // create a material; a simple white material will do the trick
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.softwhite,
  });

  // duplicate the geometry a random number of times
  var nBlocs = 10 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocs; i++) {
    // create the mesh by cloning the geometry
    var m = new THREE.Mesh(geom, mat);

    // set the position and the rotation of each cube randomly
    m.position.x = -5 + Math.random() * 10;
    m.position.y = 20;
    m.position.z = -5 + Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;

    // set the size of the cube randomly
    var s = 0.01 + Math.random() * 0.1;
    m.scale.set(s, s, s);

    // allow each cube to cast and to receive shadows
    m.castShadow = true;

    // add the cube to the container we first created
    mesh.add(m);
  }

  scene.add(mesh);
  mesh.position.x = -100 + Math.random();
  mesh.position.y = 20;
  mesh.position.z = Math.random() * -200;
  cloud.push(mesh);
}
/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createMailbox() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("mailbox.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var cat = gltf.scene.children[0];

    cat.position.set(6.1, 8, -150);

    scene.add(cat);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createKeys() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("keys.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var keys = gltf.scene.children[0];

    keys.position.set(1.1, 1.2, 27);

    scene.add(keys);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Loads GLTF/GLB ramp files from Blender
 */
function createHanger() {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("hanger.glb", handleLoad, handleProgress);

  // Load completion
  function handleLoad(gltf) {
    // Enable Shadows for loaded objects children
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    // Get scene child from file
    var keys = gltf.scene.children[0];

    keys.position.set(31, 3.5, -10);

    scene.add(keys);
  }

  // Load progress
  function handleProgress(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }
}

/**
 * Handles key presses
 * @param {*} event
 */
function onKeyDown(event) {
  switch (event.keyCode) {
    case 192: // Reset
      plane.position.set(0, 2, 5);
      break;
  }
}

function updatePhysics(deltaTime) {
  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rigid bodies
  for (let i = 0; i < rigidBodies.length; i++) {
    let objThree = rigidBodies[i];
    let objAmmo = objThree.userData.physicsBody;
    let ms = objAmmo.getMotionState();
    if (ms) {
      ms.getWorldTransform(tmpTrans);
      let p = tmpTrans.getOrigin();
      let q = tmpTrans.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}

/**
 * Updates moving objects per frame
 */
function update(deltaTime) {
  // Reposition camera to behind player
  camera.position.set(
    plane.position.x,
    plane.position.y + 15,
    plane.position.z + 10
  ) * deltaTime;

  cloud.forEach((c) => {
    c.position.x += 5 * deltaTime;
    c.position.z += Math.random() * 1.5 * deltaTime;
    if (c.position.x > 100) {
      scene.remove(c);
    }
  });
}

/**
 * Draws the Scene per frame
 */
function animate() {
  // Updates animations per delta units
  var deltaTime = clock.getDelta();

  if (!debug) update(deltaTime);
  if (mixer) mixer.update(deltaTime);

  airplaneControl.update();

  updatePhysics(deltaTime);
//   let resultantImpulse = new Ammo.btVector3( 1, 0, 0 )
//   resultantImpulse.op_mul(20);

//   let physicsBody = plane.userData.physicsBody;
//   physicsBody.setLinearVelocity( resultantImpulse );

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
