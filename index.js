var scene;
var camera;
var renderer;
var controls;
var raycaster;
var frustumPlane;
var draggableHandles = [];

var POINT_ONE   = new THREE.Vector3(0.2,0.1,0.9);
var POINT_TWO   = new THREE.Vector3(0.1,0.9,0.1);
var POINT_THREE = new THREE.Vector3(0.8,0.1,0.9);
var POINT_FOUR  = new THREE.Vector3(0.9,0.9,0.9);

function line3d(start,end,width) {
  var worldUp = new THREE.Vector3(0,1,0);

  var lineDir = new THREE.Vector3().subVectors(end,start).normalize();
  var lineRight = new THREE.Vector3().crossVectors(lineDir,worldUp).normalize();
  if (lineDir.equals(worldUp)) { lineRight = new THREE.Vector3(1,0,0) }
  var lineUp = new THREE.Vector3().crossVectors(lineDir,lineRight).normalize();

  lineUp.multiplyScalar(width * 0.5);
  lineRight.multiplyScalar(width * 0.5);
  var lineDown = new THREE.Vector3().copy(lineUp).multiplyScalar(-1)
  var lineLeft = new THREE.Vector3().copy(lineRight).multiplyScalar(-1)

  var start_dl = new THREE.Vector3().copy(start).add(lineDown).add(lineLeft);
  var start_dr = new THREE.Vector3().copy(start).add(lineDown).add(lineRight)
  var start_ul = new THREE.Vector3().copy(start).add(lineUp).add(lineLeft);
  var start_ur = new THREE.Vector3().copy(start).add(lineUp).add(lineRight);

  var end_dl = new THREE.Vector3().copy(end).add(lineDown).add(lineLeft);
  var end_dr = new THREE.Vector3().copy(end).add(lineDown).add(lineRight);
  var end_ul = new THREE.Vector3().copy(end).add(lineUp).add(lineLeft);
  var end_ur = new THREE.Vector3().copy(end).add(lineUp).add(lineRight);


  var geo = new THREE.Geometry();

  geo.vertices.push(
    start_dl, start_dr, start_ul, start_ur,
    end_dl, end_dr, end_ul, end_ur
  );

  geo.faces.push(
    new THREE.Face3(2,1,0), new THREE.Face3(3,1,2), // bottom
    new THREE.Face3(4,5,6), new THREE.Face3(6,5,7), // top
    new THREE.Face3(0,4,2), new THREE.Face3(2,4,6), // left
    new THREE.Face3(5,1,3), new THREE.Face3(3,7,5), // right
    new THREE.Face3(0,5,4), new THREE.Face3(1,5,0), // forward
    new THREE.Face3(2,6,7), new THREE.Face3(7,3,2)  // back
  );
  geo.computeBoundingSphere();

  return geo;
}

function cubeOutlines(w) {

  var lineX00 = line3d(new THREE.Vector3(0,0,0),new THREE.Vector3(1,0,0),w)
  var lineX10 = line3d(new THREE.Vector3(0,1,0),new THREE.Vector3(1,1,0),w)
  var lineX01 = line3d(new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,1),w)
  var lineX11 = line3d(new THREE.Vector3(0,1,1),new THREE.Vector3(1,1,1),w)

  var hw = w/2
  var line0Y0 = line3d(new THREE.Vector3(0,0-hw,0),new THREE.Vector3(0,1+hw,0),w)
  var line1Y0 = line3d(new THREE.Vector3(1,0-hw,0),new THREE.Vector3(1,1+hw,0),w)
  var line0Y1 = line3d(new THREE.Vector3(0,0-hw,1),new THREE.Vector3(0,1+hw,1),w)
  var line1Y1 = line3d(new THREE.Vector3(1,0-hw,1),new THREE.Vector3(1,1+hw,1),w)

  var line00Z = line3d(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,1),w)
  var line10Z = line3d(new THREE.Vector3(1,0,0),new THREE.Vector3(1,0,1),w)
  var line01Z = line3d(new THREE.Vector3(0,1,0),new THREE.Vector3(0,1,1),w)
  var line11Z = line3d(new THREE.Vector3(1,1,0),new THREE.Vector3(1,1,1),w)

  return [
    lineX00,
    lineX10,
    lineX01,
    lineX11,

    line0Y0,
    line1Y0,
    line0Y1,
    line1Y1,

    line00Z,
    line10Z,
    line01Z,
    line11Z
  ];
}

function lerp(start, end, t) {
  var start = new THREE.Vector3().copy(start).multiplyScalar(1-t)
  var end   = new THREE.Vector3().copy(end).multiplyScalar(t)
  var out   = new THREE.Vector3().addVectors(start, end)
  return out;
}

function cube(t) {
  var out = new THREE.Vector3(t*t*t,t,0.5)
  return out;
}

function sin(t) {
  var out = new THREE.Vector3(
    t,
    0.5*Math.cos(3*Math.PI*t)+0.5,
    0.5
  )
  return out;
}

function bezier(t) {
  var ab = lerp(POINT_ONE, POINT_TWO, t);
  var bc = lerp(POINT_TWO, POINT_THREE, t);
  var cd = lerp(POINT_THREE, POINT_FOUR, t);
  var abc = lerp(ab, bc, t);
  var bcd = lerp(bc, cd, t);

  return lerp(abc, bcd, t);
}

function circle(_basisX, _basisY,radius,t, offset) {
  // An example circle, on the plane of constant brightness:
  // circle(
  //   new THREE.Vector3(-0.146,0.986,-0.074),
  //   new THREE.Vector3(-0.453,0.0,0.891),
  //   0.9, //Math.sqrt(2)/2
  //   t,
  //   new THREE.Vector3(0.5,0.5, 0.5)
  // );

  if (!offset) {
    offset = new THREE.Vector3(0,0,0)
  }
  basisX = new THREE.Vector3().copy(_basisX);
  basisY = new THREE.Vector3().copy(_basisY);

  return basisX
    .multiplyScalar(Math.sin(t*2*Math.PI)*radius)
    .add(
      basisY.multiplyScalar(Math.cos(t*2*Math.PI)*radius)
    ).add(offset);
}

function colorLine(t) {
  // fn (t) -> Vector3(x,y,z)
  return bezier(t);
}

function init() {

  var container = document.createElement( 'div' );
  container.style.position = 'absolute';
  container.style.top = '0px';
  container.style.left = '0px';
  container.style.width = '100%';
  container.style.height = '100%';
  document.body.appendChild( container );

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 3;
  camera.position.y = 2;
  camera.position.x = 2;

  controls = new THREE.OrbitControls( camera );
  controls.target.set( 0.5, 0.5, 0.5 );
  controls.update();

  scene = new THREE.Scene();
  rgbMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent
  });

  // Generate and add cube outlines
  var outlinesMesh;
  cubeOutlines(0.05).forEach(function(line){
    outlinesMesh = new THREE.Mesh( line, rgbMaterial );
    scene.add(outlinesMesh);
  });

  // Frustum plane for dragging
  var planeMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  planeMat.visible = false
  frustumPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(500, 500, 8, 8), planeMat);
  scene.add(frustumPlane);


  // 0.30R + 0.59G + 0.11B
  // Perceptually even plane basis:
  // x->g
  // y->b
  // z->r
  // var rgbShift = new THREE.Vector3(0.59,0.11,0.30).normalize();
  // var basisY = new THREE.Vector3(-0.146,0.986,-0.074);
  // var basisX = new THREE.Vector3(-0.453,0.0,0.891)
  // var vec1 = line3d(
  //   new THREE.Vector3(0,0,0).add(new THREE.Vector3(0.5,0.5,0.5)),
  //   basisY.add(new THREE.Vector3(0.5,0.5,0.5)),
  //   0.05
  // );
  // var vec2 = line3d(
  //   new THREE.Vector3(0,0,0).add(new THREE.Vector3(0.5,0.5,0.5)),
  //   //new THREE.Vector3(0.891,-0.453,0.0),
  //   basisX.add(new THREE.Vector3(0.5,0.5,0.5)),
  //   0.05
  // );
  // var rgbShiftLine = line3d(
  //   new THREE.Vector3(0,0,0),
  //   rgbShift,
  //   0.05
  // );
  // var defaultVec = line3d(
  //   new THREE.Vector3(0,0,0),
  //   new THREE.Vector3(1,1,1).normalize(),
  //   0.05
  // );
  // scene.add(new THREE.Mesh( vec1, rgbMaterial ));
  // scene.add(new THREE.Mesh( vec2, rgbMaterial ));
  // scene.add(new THREE.Mesh( rgbShiftLine, rgbMaterial ));
  // scene.add(new THREE.Mesh( defaultVec, rgbMaterial ));

  initHandles();

  renderer.setClearColor(0xcccccc, 1);
  render();
}

function render() {
  requestAnimationFrame( render );
  renderer.render(scene, camera);
}

var handleConnectors = []
function initHandles() {
  // bezier curve handles
  var handleMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
  var sphere;
  [POINT_ONE, POINT_TWO, POINT_THREE, POINT_FOUR].forEach(function(handle) {
    var handleGeometry = new THREE.SphereGeometry( 0.06, 32, 32 );

    sphere = new THREE.Mesh( handleGeometry, handleMaterial );
    sphere.position.set(handle.x, handle.y, handle.z);
    draggableHandles.push(sphere);
    scene.add( sphere );
  });
  // var handleTangent1 = line3d(POINT_ONE, POINT_TWO, 0.01)
  // var handleTangent2 = line3d(POINT_THREE, POINT_FOUR, 0.01)
  // var handleTangentMesh1 = new THREE.Mesh(handleTangent1, handleMaterial) );
  // var handleTangentMesh2 = new THREE.Mesh(handleTangent2, handleMaterial) );
  // handleTangents.push( handleTangentMesh1 );
  // handleTangents.push( handleTangentMesh2 );
  // scene.add( handleTangentMesh1 );
  // scene.add( handleTangentMesh2 );

  var material = new THREE.LineBasicMaterial({
    color: 0xffff00
  });

  hgeo = new THREE.BufferGeometry();
  hgeo.attributes = {
    position: {
      itemSize: 3,
      array: new Float32Array(4)
    }
  };

  hgeo.vertices.push(
    POINT_ONE,
    POINT_TWO,
    POINT_THREE,
    POINT_FOUR
  );

  var line = new THREE.Line( hgeo, material );
  scene.add( line );
}

function updateHandles() {
  hgeo.verticesNeedUpdate = true

}

function update() {
  updateHandles();
  updateCurve();
}

function updateCurve() {
  // Generate and add color gradient curve
  var colorLineMesh;
  var currentLine;
  var current = null;
  var prev =  null;
  // TODO(lito): make splitting in to steps automatic
  var lineSegments = 20;
  var a = [0];
  for (var i = 0; i < 1; i += 1/lineSegments) {
    a.push(i);
  }
  a.push(1);

  a.forEach(function(time) {
    prev    = current;
    current = time;

    if (current !== null && prev !== null) {
      currentLine = line3d(
        colorLine(prev),
        colorLine(current),
        0.05
      );
      colorLineMesh = new THREE.Mesh( currentLine, rgbMaterial );
      scene.add(colorLineMesh);
    }

  });
}

var mouse = new THREE.Vector2();

function onMouseMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

var offset = new THREE.Vector3(0,0,0);
var selection = null;
document.body.addEventListener("mouseup", function(event) {
  update();
  controls.enabled = true;
  selection = null;
});

document.body.addEventListener("mousedown", function(event) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
  vector.unproject(camera);

  raycaster.set(camera.position, vector.sub(camera.position).normalize());

  var intersects = raycaster.intersectObjects(draggableHandles);
  if (intersects.length > 0) {
    controls.enabled = false;
    selection = intersects[0].object;
    var intersects = raycaster.intersectObject(frustumPlane);
    offset.copy(intersects[0].point).sub(frustumPlane.position)
  }

  POINT_ONE = draggableHandles[0].position;
  POINT_TWO = draggableHandles[1].position;
  POINT_THREE = draggableHandles[2].position;
  POINT_FOUR = draggableHandles[3].position;
});

document.body.addEventListener("mousemove", function(event){
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
  vector.unproject(camera);

  raycaster.set(camera.position, vector.sub(camera.position).normalize());

  if (selection) {
    var intersects = raycaster.intersectObject(frustumPlane);
    selection.position.copy(intersects[0].point.sub(offset));
  } else{
    var intersects = raycaster.intersectObjects(draggableHandles);
    // Update frustum plane
    if (intersects.length > 0) {
      frustumPlane.position.copy(intersects[0].object.position);
      frustumPlane.lookAt(camera.position);
    }
  }
});

init();
