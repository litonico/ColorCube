var scene;
var camera;
var renderer;

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

function lerp(t) {
  // lerp
  var start = new THREE.Vector3(0,0,0).multiplyScalar(1-t)
  var end   = new THREE.Vector3(1,1,1).multiplyScalar(t)
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

function colorLine(t) {
  // fn (t) -> Vector3(x,y,z)
  return cube(t);
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

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 5;

  controls = new THREE.OrbitControls( camera );
  controls.target.set( 0, 0, 0 );

  scene = new THREE.Scene();
  var material = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent
  });

  // Generate and add cube outlines
  var outlinesMesh;
  cubeOutlines(0.05).forEach(function(line){
    outlinesMesh = new THREE.Mesh( line, material );
    scene.add(outlinesMesh);
  });

  // Perceptually even plane basis:
  // x->g
  // y->b
  // z->r
  var vec1 = line3d(
    new THREE.Vector3(0,0,0).add(new THREE.Vector3(0.5,0.5,0.5)),
    new THREE.Vector3(-0.146,0.986,-0.074).add(new THREE.Vector3(0.5,0.5,0.5)),
    0.05
  );

  var vec2 = line3d(
    new THREE.Vector3(0,0,0).add(new THREE.Vector3(0.5,0.5,0.5)),
    //new THREE.Vector3(0.891,-0.453,0.0),
    new THREE.Vector3(-0.453,0.0,0.891).add(new THREE.Vector3(0.5,0.5,0.5)),
    0.05
  );
  scene.add(new THREE.Mesh( vec1, material ));
  scene.add(new THREE.Mesh( vec2, material ));

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
      colorLineMesh = new THREE.Mesh( currentLine, material );
      scene.add(colorLineMesh);
    }

  });

  renderer.setClearColor(0xcccccc, 1);
  render();
}

function render() {
  // TODO(Lito) geometry.morphTargets.push( { name: "target" + i, vertices: vertices } );
  requestAnimationFrame( render );
  renderer.render(scene, camera);
}

var mouse = new THREE.Vector2();

function onMouseMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

var mouseDown;
document.body.addEventListener("mouseup", function(event) {
  mouseDown = false;
});
document.body.addEventListener("mousedown", function(event) {
  mouseDown = true;
});
document.body.addEventListener("mousemove", onMouseMove, false);

init();
