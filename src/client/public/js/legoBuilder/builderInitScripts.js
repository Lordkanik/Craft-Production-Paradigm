/**
 * author: Daniel Kovalevich
 * purpose: Created for research project with Dr. Aqlan of PSU
 */

'use strict';

/**
 * ================================================================
 *          INITIALIZE SCENE AND STATE VARIABLES
 * ================================================================
 */

if (!Detector.webgl)
  Detector.addGetWebGLMessage();
var container;
var camera, scene, renderer, controls;
var plane, cube;
var mouse, raycaster, isCtrlDown = false, isShiftDown = false;
var /* rollOverMesh = null,*/ material, collisionBox;
let partModelCache = {};
let binPartIDs = [];
const TILE_DIMENSIONS = new THREE.Vector2(24, 24);
const DEFAULT_VIEW_CAMERA_OFFSET = new THREE.Vector3(0.0, 1420.0, 2300.0);
var objects = [], collisionObjects = [];
var currentObj = null;
// var group = new THREE.Group();

// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button for further details
window.MouseButtons = {
  // Main/left mouse button
  MAIN_BUTTON: 0,
  // Auxiliary/middle mouse button
  AUXILIARY_BUTTON: 1,
  // Secondary/right mouse button
  SECONDARY_BUTTON: 2,
  // Fourth (usually "Browser Back") mouse button
  FOURTH_BUTTON: 3,
  // Fifth (usually "Browser Forward") mouse button
  FIFTH_BUTTON: 4
};

class RolloverGroup extends THREE.Group
{
  constructor()
  {
    super();

    this.movementBasisObj = null;
    this.collisionBox = null;

    // Set of models in this RolloverGroup (does not include auxiliary objects
    // such as cursor components that are also children of this RolloverGroup).
    // Please do not modify this set directly from code external to this class;
    // instead, use .add, .remove, and .clear on RolloverGroup.
    this.models = new Set();

    this.generateCursor();
  }

  generateCursor()
  {
    const CURSOR_COLOR = '#00ff00';
    let cursorGroup = new THREE.Group();
    let cursorSphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry(10.0),
        new THREE.MeshPhongMaterial({ color: CURSOR_COLOR })
    );

    let cursorLineGeom = new THREE.Geometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 100, 0),
      new THREE.Vector3(0, 200, 0)
    ]);
    cursorLineGeom.faces.push(new THREE.Face3(0, 1, 2));
    cursorLineGeom.elementsNeedUpdate = true;

    let cursorLine = new THREE.Line(
        cursorLineGeom,
        // new THREE.EdgesGeometry(new THREE.BoxGeometry(100, 100, 100), 1),
        // new THREE.LineBasicMaterial( {
        //       color: 0xffffff,
        //       linewidth: 5})
        // new THREE.MeshBasicMaterial({color: 0x00ff00, visible: true, wireframe: true})
        new THREE.LineDashedMaterial({ color: CURSOR_COLOR, linewidth: 2, dashSize: 20, gapSize: 6 })
    );
    cursorLine.computeLineDistances();
    cursorLine.visible = false;

    cursorGroup.add(cursorSphere, cursorLine);
    super.add(cursorGroup);
    this.cursorGroup = cursorGroup;
    this.cursorLine = cursorLine;
  }

  /**
   * @param {THREE.Object3D} object
   * @returns {THREE.Mesh}
   */
  generateCollisionBox(object)
  {
    let existingCollisionBox = object.getObjectByName('CollisionBox');
    if(existingCollisionBox !== undefined)
    {
      return existingCollisionBox;
    }
    else
    {
      let newCollisionBox = generateCollisionCube(object);
      newCollisionBox.name = 'CollisionBox';
      object.add(newCollisionBox);

      return newCollisionBox;
    }
  }

  /**
   *
   * @param {THREE.Mesh} objMesh
   */
  positionRelativeTo(objMesh)
  {
    if(!this.models.has(objMesh)) throw 'Cannot position relative to external object.';

    this.movementBasisObj = objMesh;

    let newBasePosition = objMesh.position.clone();

    let minCollisionY = null;
    for(let thisModel of this.models)
    {
      let collisionBox = thisModel.getObjectByName('CollisionBox');
      collisionBox.geometry.computeBoundingBox();
      let objBottom = thisModel.position.clone().add(collisionBox.geometry.boundingBox.min);

      if(minCollisionY === null || objBottom.y < minCollisionY) minCollisionY = objBottom.y;
    }
    newBasePosition.y = minCollisionY;
    this.models.forEach(thisModel => thisModel.position.sub(newBasePosition));

    if(this.models.size === 1)
    {
      let objCollisionBox = objMesh.getObjectByName('CollisionBox');
      objCollisionBox.geometry.computeBoundingBox();
      this.collisionBox = objCollisionBox.geometry.boundingBox.clone();

      this.cursorLine.visible = false;
    }
    else
    {
      this.collisionBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

      this.cursorLine.visible = true;
      this.cursorLine.geometry.vertices[1].y = objMesh.position.y / 2;
      this.cursorLine.geometry.vertices[2].y = objMesh.position.y;
      this.cursorLine.geometry.verticesNeedUpdate = true;
      this.cursorLine.geometry.lineDistancesNeedUpdate = true;
      // this.cursorLine.scale.y = objMesh.position.y;
      this.cursorLine.computeLineDistances();
    }
  }

  add(...object)
  {
    object.forEach(thisObj => {
      this.generateCollisionBox(thisObj);
      this.models.add(thisObj);
    });

    super.add(...object);
  }

  remove(...object)
  {
    if(object.some(value => value === this.movementBasisObj))
    {
      this.movementBasisObj = null;
      this.collisionBox = null;
    }

    object.forEach(value => this.models.delete(value));
    super.remove(...object);
  }

  clear()
  {
    this.movementBasisObj = null;
    this.collisionBox = null;

    this.setRotationFromEuler(new THREE.Euler());

    this.models.forEach(thisModel => super.remove(thisModel));
    this.models.clear();
    this.cursorLine.visible = false;
  }
}

// Kicks off the program
$(function() {
  init();
  animate();
  render();
});

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  createEnvironment(() => {
    let activeWorkbench = getActiveWorkbench();
    createGridAndPlane(activeWorkbench);
    createSigns();
    moveCameraToWorkbench(activeWorkbench);
  }, checkPieces);

  let selectedItems = new Set();
  let rolloverGroup = new RolloverGroup();
  rolloverGroup.visible = false;
  scene.add(rolloverGroup);

  //objects.push(plane);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  addSceneLights();
  initCamera();
  // Event listeners
  document.addEventListener('mousemove', event => onDocumentMouseMove(event, rolloverGroup), false);
  document.addEventListener('mousedown', event => onDocumentMouseDown(event, rolloverGroup, selectedItems), false);
  document.addEventListener('keydown', event => onDocumentKeyDown(event, rolloverGroup), false);
  document.addEventListener('keyup', onDocumentKeyUp, false);
  renderer.domElement.addEventListener('wheel', event => onRendererMouseWheel(event, rolloverGroup), false);
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('beforeunload', event => onBeforePageUnload(event, rolloverGroup));
  window.addEventListener('unload', event => onPageUnload(event, rolloverGroup));
}

// Initializes the camera -- Allows to use mouse wheel to zoom
function initCamera() {
  //camera = new THREE.PerspectiveCamera(60, window.innerWidth / (window.innerHeight + (window.innerHeight * .1)), 1, 10000);
  camera = new THREE.PerspectiveCamera(60, $(renderer.domElement).width() / $(renderer.domElement).height(), 1, 100000);
  camera.position.copy(DEFAULT_VIEW_CAMERA_OFFSET);
  camera.lookAt(new THREE.Vector3());
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.addEventListener( 'change', render );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1;
  controls.panSpeed = 0.8;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableDamping = false;
  controls.dampingFactor = 0.75;
  controls.minDistance = 200;
	controls.maxDistance = 10000;
}

function moveCameraToWorkbench(workbench)
{
  workbench.geometry.computeBoundingBox();
  let avgX = workbench.position.x +
      (workbench.geometry.boundingBox.min.x + workbench.geometry.boundingBox.max.x) / 2.0,
    avgXVector = new THREE.Vector3(avgX, 0.0, 0.0);
  camera.position.copy(DEFAULT_VIEW_CAMERA_OFFSET);
  camera.position.add(avgXVector);
  controls.target.copy(avgXVector);
  controls.update();
}

function computeRendererSize()
{
  return {
    width: window.innerWidth,
    height: (window.innerHeight - $(renderer.domElement).offset().top)
  };
}

// Adds header information at the top of the page
/*function generateHeaderInfo() {
  container = document.createElement('div');
  document.body.appendChild(container);
  var info = document.createElement('div');
  info.style.position = 'relative';
  info.style.backgroundColor = '0xf0f0f0';
  //info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = 
    '' +
    '' + 
    '';
  container.appendChild(info);
}*/

function addSceneLights() {
  container = document.createElement('div');
  document.body.appendChild(container);
  var ambientLight = new THREE.AmbientLight(0x606060);
  scene.add(ambientLight);
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 0.75, 0.5).normalize();
  scene.add(directionalLight);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  let initialRendererSize = computeRendererSize();
  renderer.setSize(initialRendererSize.width, initialRendererSize.height);
}

function createTextTexture(text, font, width, height, padX, padY)
{
  let renderingCanvas = document.createElement('canvas');
  renderingCanvas.width = width + 2 * padX;
  renderingCanvas.height = height + 2 * padY;

  let context2D = renderingCanvas.getContext('2d');
  context2D.font = height + 'px ' + font;
  context2D.fillStyle = '#ffffff';
  context2D.fillRect(0, 0, renderingCanvas.width, renderingCanvas.height);
  context2D.fillStyle = '#000000';
  context2D.textAlign = 'center';
  context2D.fillText(text, renderingCanvas.width / 2, padY + height, width);

  // document.body.appendChild(renderingCanvas);

  return new THREE.CanvasTexture(renderingCanvas);
}

function createSigns()
{
  const SIGN_DIMS = new THREE.Vector3(1000.0, 500.0, 30.0);
  let signGeometry = new THREE.BoxGeometry(SIGN_DIMS.x, SIGN_DIMS.y, SIGN_DIMS.z);
  let signTemplateMatPlain = new THREE.MeshPhongMaterial({
    color: '#deb887',
    shininess: 30,
    specular: '#ffdcac'
  });

  let roomObj = scene.getObjectByName('Environment').getObjectByName('Room');
  let workbenchGroup = roomObj.getObjectByName('Workbenches');

  for(let stationOrder = 0; stationOrder < Object.keys(partProperties.STATIONS).length; stationOrder++)
  {
    let thisWorkbench = workbenchGroup.children[stationOrder];
    let signText;

    if(getStation() !== null)
    {
      let thisStation = partProperties.STATIONS[Object.keys(partProperties.STATIONS)
          .find(key => partProperties.STATIONS[key].order === stationOrder)];

      signText = thisStation.dispName;
    }
    else
    {
      signText = "Craft Station #" + (stationOrder + 1);
    }

    let newSignMatImg = signTemplateMatPlain.clone();
    newSignMatImg.map = createTextTexture(signText, 'sans-serif', 800, 200, 112, 156);
    let newSignMesh = new THREE.Mesh(signGeometry,
        [signTemplateMatPlain, signTemplateMatPlain, signTemplateMatPlain, signTemplateMatPlain,
          newSignMatImg, signTemplateMatPlain]);

    thisWorkbench.geometry.computeBoundingBox();
    let avgX = (thisWorkbench.geometry.boundingBox.min.x + thisWorkbench.geometry.boundingBox.max.x) / 2.0;
    newSignMesh.position.set(avgX, 1000.0, thisWorkbench.geometry.boundingBox.min.z + SIGN_DIMS.z / 2.0);
    thisWorkbench.add(newSignMesh);
  }
}

function makeGrid(startX, startZ, endX, endZ, elemSizeX, elemSizeZ)
{
  let geometry = new THREE.Geometry();

  for(let i = 0; (startX + (i - 0.5) * elemSizeX) < endX; i++)
  {
    let thisX = startX + (i * elemSizeX);
    geometry.vertices.push(new THREE.Vector3(thisX, 0, startZ));
    geometry.vertices.push(new THREE.Vector3(thisX, 0, endZ));
  }

  for(let i = 0; (startZ + (i - 0.5) * elemSizeZ) < endZ; i++)
  {
    let thisZ = startZ + (i * elemSizeZ);
    geometry.vertices.push(new THREE.Vector3(startX, 0, thisZ));
    geometry.vertices.push(new THREE.Vector3(endX, 0, thisZ));
  }

  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: "#000000",
    linewidth: 1
  }))
}

function createGridAndPlane(workbenchObj) {
  workbenchObj.geometry.computeBoundingBox();
  let minCorner = (new THREE.Vector3()).copy(workbenchObj.position).add(workbenchObj.geometry.boundingBox.min),
      maxCorner = (new THREE.Vector3()).copy(workbenchObj.position).add(workbenchObj.geometry.boundingBox.max);
  let startX = Math.trunc(minCorner.x / TILE_DIMENSIONS.x) * TILE_DIMENSIONS.x,
      endX = Math.trunc(maxCorner.x / TILE_DIMENSIONS.x) * TILE_DIMENSIONS.x,
      endZ = Math.trunc(maxCorner.z / TILE_DIMENSIONS.y) * TILE_DIMENSIONS.y,
      startZ = endZ - (TILE_DIMENSIONS.y * 24);
  let gridHelper = makeGrid(startX, startZ, endX, endZ, TILE_DIMENSIONS.x, TILE_DIMENSIONS.y);// new THREE.GridHelper(PLANE_LENGTH, NUM_GRID_TILES);
  scene.add(gridHelper);
  let geometry = new THREE.PlaneBufferGeometry(endX - startX, endZ - startZ);
  geometry.rotateX(-Math.PI / 2);
  plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({visible: false}));
  plane.position.set((startX + endX) / 2, 0, (startZ + endZ) / 2);
  plane.name = 'plane';
  scene.add(plane);
  collisionObjects.push(plane);
}

function addMeshRow(templateMesh, newMeshParent, startX, yPos, zPos, spacing, numMeshes)
{
  templateMesh.geometry.computeBoundingBox();
  let posMultiplier = (templateMesh.geometry.boundingBox.max.x - templateMesh.geometry.boundingBox.min.x) + spacing;

  for(let i = 0; i < numMeshes; i++)
  {
    let thisMesh = templateMesh.clone();
    thisMesh.position.copy(new THREE.Vector3(startX + i * posMultiplier, yPos, zPos));

    newMeshParent.add(thisMesh);
  }
}

function getActiveWorkbench()
{
  let pageStation = getStation();
  return scene.getObjectByName('Environment').getObjectByName('Room')
      .getObjectByName('Workbenches').children[pageStation !== null ? pageStation.order : 0];
}

function createEnvironment(onRoomCompleted, onBinsCompleted)
{
  let modelLoader = new THREE.STLLoader();
  modelLoader.load('../objects/environment/workbench.stl', function(workbenchGeometry) {
    workbenchGeometry.scale(30, 30, 30);
    workbenchGeometry.computeBoundingBox();

    let material = new THREE.MeshPhongMaterial({
      color: '#8b5a2b',
      shininess: 30,
      specular: '#ffb245'
    });

    /*let testGeom = new THREE.PlaneBufferGeometry(200, 200, 1, 1);
    let testMesh = new THREE.Mesh(testGeom, material);
    scene.add(testMesh);*/

    // assignUVs(workbenchGeometry);
    let workbenchTemplateMesh = new THREE.Mesh(workbenchGeometry, material);

    let bboxSize = new THREE.Vector3();
    workbenchGeometry.boundingBox.getSize(bboxSize);
    // workbenchTemplateMesh.position.copy(new THREE.Vector3(-(bboxSize.x / 2), 925, -1000));
    // workbenchTemplateMesh.userData.envObject = true;

    let envGroup = new THREE.Group();
    envGroup.name = 'Environment';
    scene.add(envGroup);

    let roomGroup = new THREE.Group();
    roomGroup.name = 'Room';
    envGroup.add(roomGroup);

    let workbenchGroup = new THREE.Group();
    workbenchGroup.name = 'Workbenches';
    roomGroup.add(workbenchGroup);

    const cornerWorkbenchPos = new THREE.Vector3(-(bboxSize.x / 2), 925, -1000),
      pageStation = getStation(),
      workbenchSpacing = 200;

    addMeshRow(workbenchTemplateMesh, workbenchGroup, cornerWorkbenchPos.x, cornerWorkbenchPos.y, cornerWorkbenchPos.z,
        workbenchSpacing, Object.keys(partProperties.STATIONS).length);

    let activeWorkbench = getActiveWorkbench();

    // scene.add(workbenchTemplateMesh);

    modelLoader.load('../objects/environment/part_bin.stl', function(binGeometry) {
      const binStartX = 175, // -(bboxSize.x / 2) + 175;
        backBinZ = -450,
        frontBinZ = 75,
        maxBinsPerRow = 12;

      let binMaterial = new THREE.MeshPhongMaterial({
        color: "#0000ff",
        shininess: 5,
        specular: "#d6d0ff"
      });

      if(pageStation !== null)
      {
        binPartIDs = partProperties.getPartIDsByStation(pageStation.order);
      }
      else
      {
        binPartIDs = Object.keys(partProperties.PARTS).map(value => parseInt(value));
      }

      let binTemplateMesh = new THREE.Mesh(binGeometry, binMaterial);
      binTemplateMesh.name = "partBin";

      let binGroup = new THREE.Group();
      binGroup.name = 'Bins';
      activeWorkbench.add(binGroup);

      for(let partRowNum = 0; partRowNum < (binPartIDs.length / maxBinsPerRow); partRowNum++)
      {
        let binsRemaining = binPartIDs.length - (partRowNum * maxBinsPerRow);

        addMeshRow(binTemplateMesh, binGroup, binStartX,
            cornerWorkbenchPos.y * (Math.floor(partRowNum / 2) - 1), // Starting at -cornerWorkbenchPos.y,
                                                                              // move up cornerWorkbenchPos.y every two rows
            (partRowNum === 1 ? frontBinZ : backBinZ), // Even rows in the front, odd rows in the back
            50,
            Math.min(binsRemaining, maxBinsPerRow));
      }

      if(onBinsCompleted) {
        onBinsCompleted();
      }
    }, undefined, function(ex) {
      console.trace(ex);
    });

    let workbenchCorner = (new THREE.Vector3()).copy(cornerWorkbenchPos).add(workbenchGeometry.boundingBox.min);

    let texLoader = new THREE.TextureLoader();
    texLoader.load('../images/Door_Texture.jpg', (doorTexture => {
      const roomHeight = 8000;
      const doorWidth = (doorTexture.image.width / doorTexture.image.height) * roomHeight;

      let doorGeometry = new THREE.PlaneBufferGeometry(doorWidth, roomHeight);
      let doorMaterial = new THREE.MeshBasicMaterial({
        map: doorTexture
      });
      let doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
      doorMesh.position.set(workbenchCorner.x + (doorWidth / 2), workbenchCorner.y + (roomHeight / 2), workbenchCorner.z + 16000);
      doorMesh.rotateY(Math.PI);
      roomGroup.add(doorMesh);

      const wallParams = [
        {
          position: new THREE.Vector3(workbenchCorner.x, workbenchCorner.y, workbenchCorner.z + 8000),
          rotation: new THREE.Euler(0, (Math.PI / 2), 0),
          size: new THREE.Vector2(16000, roomHeight)
        },
        {
          position: new THREE.Vector3(workbenchCorner.x + 16000, workbenchCorner.y, workbenchCorner.z),
          rotation: new THREE.Euler(0, 0, 0),
          size: new THREE.Vector2(32000, roomHeight)
        },
        {
          position: new THREE.Vector3(workbenchCorner.x + 32000, workbenchCorner.y, workbenchCorner.z + 8000),
          rotation: new THREE.Euler(0, -(Math.PI / 2), 0),
          size: new THREE.Vector2(16000, roomHeight)
        },
        {
          position: new THREE.Vector3(workbenchCorner.x + 16000 + (doorWidth / 2), workbenchCorner.y, workbenchCorner.z + 16000),
          rotation: new THREE.Euler(0, Math.PI, 0),
          size: new THREE.Vector2(32000 - doorWidth, roomHeight)
        }
      ];

      texLoader.load('../images/Wall_Texture.jpg', (wallTemplateTexture => {
        const imageWorldSize = new THREE.Vector2(1000, 1000);
        wallTemplateTexture.wrapS = wallTemplateTexture.wrapT = THREE.RepeatWrapping;

        wallParams.forEach((elem) => {
          let thisWallTexture = wallTemplateTexture.clone();
          thisWallTexture.repeat = new THREE.Vector2(
            elem.size.x / imageWorldSize.x,
            elem.size.y / imageWorldSize.y
          );

          let thisWallMaterial = new THREE.MeshBasicMaterial({
            map: thisWallTexture
          });
          thisWallTexture.needsUpdate = true;
          let thisWallGeometry = new THREE.PlaneBufferGeometry(elem.size.x, elem.size.y);

          let thisWallMesh = new THREE.Mesh(thisWallGeometry, thisWallMaterial);
          thisWallMesh.position.copy(elem.position);
          thisWallMesh.position.y += (elem.size.y / 2);
          thisWallMesh.setRotationFromEuler(elem.rotation);

          roomGroup.add(thisWallMesh);
        });

        if(onRoomCompleted) {
          onRoomCompleted();
        }
      }), undefined, function (ex) {
        console.trace(ex);
      });
    }), undefined, function(ex) {
      console.trace(ex);
    });

    texLoader.load('../images/Floor_Texture.jpg', (floorTexture) => {
      const floorImageWorldSize = new THREE.Vector2(1500, 1500);
      const floorSize = new THREE.Vector2(32000, 16000);

      floorTexture.repeat.set(
        floorSize.x / floorImageWorldSize.x,
        floorSize.y / floorImageWorldSize.y
      );
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.needsUpdate = true;

      let floorGeometry = new THREE.PlaneBufferGeometry(floorSize.x, floorSize.y);
      let floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture
      });

      let floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.set(workbenchCorner.x + 16000, workbenchCorner.y, workbenchCorner.z + 8000);
      floorMesh.rotateX(-(Math.PI / 2));
      roomGroup.add(floorMesh);
    }, undefined, function(ex) {
      console.trace(ex);
    });

  }, undefined, function(ex) {
    console.trace(ex);
  });
}

function onWindowResize() {
  let newRendererSize = computeRendererSize();

  camera.aspect = newRendererSize.width / newRendererSize.height;
  camera.updateProjectionMatrix();
  renderer.setSize(newRendererSize.width, newRendererSize.height);
}

function render() { renderer.render(scene, camera); }

function animate() {
  controls.update();
  render();
  requestAnimationFrame(animate);
}