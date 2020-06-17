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
const projection = mat4.perspective(util.degToRad(45), aspect, 1, 2000);

// rotation angle
let angle = 0;

function draw() {
	// rezie canvas
	gl.reSize();

	// clear background color
	gl.clear(200, 240, 250);

	// calc view matrix

	for (let i = 0; i < 2; i++) {
		let modelView = mat4.identity();
		modelView = mat4.multiply(projection, modelView);
		modelView = mat4.translate(modelView, Math.cos(Math.PI * i) * 3, 0, -10);

		// rotate cube
		angle = (performance.now() / 100) * 2 * Math.PI;
		modelView = mat4.xRotate(modelView, util.degToRad(angle));
		modelView = mat4.yRotate(modelView, util.degToRad(angle));
		modelView = mat4.zRotate(modelView, util.degToRad(angle));

		webgl.uniformMatrix4fv(viewLocation, false, modelView);

		// draw the triangle
		webgl.drawElements(webgl.TRIANGLES, posIndices.length, webgl.UNSIGNED_SHORT, 0);
	}

	requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
