const cameraHSlider = document.getElementById('cameraH');
const cameraVSlider = document.getElementById('cameraV');

// init webgl
const gl = new GL('canvas', true);
const webgl = gl._gl;

// create shader program
const program = gl.createProgramFromSource('vertex-shader-src', 'fragment-shader-src');

// get the program attribute locations
const posLocation = gl.getLocation(gl.ATTR, 'a_position');
const colorLocation = gl.getLocation(gl.ATTR, 'a_color');
const viewLocation = gl.getLocation(gl.UNIFORM, 'modelView');

// create the position buffer
const posBuffer = gl.createBuffer(posData);

// create the index buffer
const indexBuffer = gl.createBuffer(posIndices, gl.INDEX_BUFFER);

// camera angles
let cameraHAngle = util.degToRad(0);
let cameraVAngle = util.degToRad(0);
cameraHSlider.oninput = function ({ target }) {
	cameraHAngle = util.degToRad(target.value);
};
cameraVSlider.oninput = function ({ target }) {
	cameraVAngle = util.degToRad(target.value);
};

// set the current program
gl.useProgram();

// define position attribute
webgl.vertexAttribPointer(posLocation, 3, webgl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);

// define color attribute
webgl.vertexAttribPointer(
	colorLocation,
	3,
	webgl.FLOAT,
	false,
	6 * Float32Array.BYTES_PER_ELEMENT,
	3 * Float32Array.BYTES_PER_ELEMENT
);

// turn on the vertex attributes
webgl.enableVertexAttribArray(posLocation);
webgl.enableVertexAttribArray(colorLocation);

// projection matrix
const aspect = webgl.canvas.clientWidth / webgl.canvas.clientHeight;
const projection = mat4.perspective(util.degToRad(60), aspect, 1, 2000);

// rotation angle
let angle = 0;

function draw() {
	// rezie canvas
	gl.reSize();

	// clear background color
	gl.clear(200, 240, 250);

	// Compute a matrix for the camera
	let cameraMatrix = mat4.yRotation(cameraHAngle);
	cameraMatrix = mat4.xRotate(cameraMatrix, cameraVAngle);
	cameraMatrix = mat4.translate(cameraMatrix, 0, 0, 5 * 1.5);

	// Get the camera's position from the matrix we computed
	let cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];

	// the up direction
	let up = [0, 1, 0];

	// Compute the camera's matrix using look at.
	cameraMatrix = mat4.lookAt(cameraPosition, [5, 0, 0], up);

	// calc view matrix
	let modelView = mat4.inverse(cameraMatrix);
	modelView = mat4.multiply(projection, modelView);
	for (let i = 0; i < 2; i++) {
		let angle = (i * Math.PI * 2) / 2;
		let x = Math.cos(angle) * 5;
		let y = Math.sin(angle) * 5;

		// calc matrices
		modelView = mat4.translate(modelView, x, 0, y);

		webgl.uniformMatrix4fv(viewLocation, false, modelView);

		// trigger a draw call
		webgl.drawElements(webgl.TRIANGLES, posIndices.length, webgl.UNSIGNED_SHORT, 0);
	}

	requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
