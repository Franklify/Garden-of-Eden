//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (Why the numbers? counts columns, helps me keep 80-char-wide listings)
//

// John Franklin
// Open "Garden_of_Eden.html" with a browser to run program
 
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform float u_Bool;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec3 a_Color;\n' +
  'attribute vec3 a_Normal;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  'vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
  'vec3 normVec = normalize(transVec.xyz);\n' +
  'vec3 lightVec = vec3(0.0, 0.0, -1.0);\n' +       
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = (u_Bool < 0.5) ? vec4(a_Color, 1.0)\n' +
  '                           : vec4(0.2*a_Color + 0.8*dot(normVec,lightVec), 1.0);\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
var scalar = 0;
var direction = -0.01;	
var speed = 1;
var height = .5;
var now = 0;
var elapsed = 0; 
var paused = false;	
var velF = 0.1;
var velS = 0.075;
var thetaStep = 5 * 2 * Math.PI / 360;
var tiltStep = 0.05;
var ANGLE_STEP = 15.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 10;	// # of Float32Array elements used for each vertex
													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.

function main() {
//==============================================================================
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  // Create, init current rotation angle value in JavaScript
  currentAngle = 0.0;


  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }            
  // Next, register all keyboard events found within our HTML webpage window:
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.3, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
  gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
  gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  g_modelMatrix = new Matrix4();
  
  // Get handle to graphics systems' storage location for u_NormalMatrix
	g_u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	if(!g_u_NormalMatrix) {
		console.log('Failed to get GPU storage location for u_NormalMatrix');
		return
	}
	// Create our JavaScript 'normal' matrix (we send its values to GPU
	g_normalMatrix = new Matrix4();

  
  // Get handle to graphics systems' storage location for boolean
  g_u_Bool = gl.getUniformLocation(gl.program, 'u_Bool');
  if(!g_u_Bool) {
    console.log('Failed to get GPU storage location for u_Bool');
    return
  }
  // Create our JavaScript 'normal' matrix (we send its values to GPU
  g_bool = 0.0;

  // NEW! -- make new canvas to fit the browser-window size;
  drawResize(n, currentAngle, g_modelMatrix, g_u_ModelMatrix, g_normalMatrix, g_u_NormalMatrix, g_bool, g_u_Bool);   // On this first call, Chrome browser seems to use the
                  // initial fixed canvas size we set in the HTML file;
                  // But by default Chrome opens its browser at the same
                  // size & location where you last closed it, so
  drawResize(n, currentAngle, g_modelMatrix, g_u_ModelMatrix, g_normalMatrix, g_u_NormalMatrix, g_bool, g_u_Bool);   // Call drawResize() a SECOND time to re-size canvas to
                  // match the current browser size.

//-----------------  

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, g_modelMatrix, g_u_ModelMatrix, g_normalMatrix, g_u_NormalMatrix, g_bool, g_u_Bool);    // Draw shapes
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
  sphsVerts = [];
  var aColr1 = new Float32Array([0.4, 0.6, 0.6]);
  var aColr2 = new Float32Array([0.6, 0.4, 0.6]);
  var aColr3 = new Float32Array([0.6, 0.6, 0.4]);

  var bColr1 = new Float32Array([0.9, 0.5, 0.5]);
  var bColr2 = new Float32Array([0.5, 0.9, 0.5]);
  var bColr3 = new Float32Array([0.9, 0.5, 0.5]);

  var cColr1 = new Float32Array([0.1, 0.8, 0.8]);
  var cColr2 = new Float32Array([0.8, 0.1, 0.8]);
  var cColr3 = new Float32Array([0.8, 0.8, 0.1]);

  var dColr1 = new Float32Array([0.3, 0.3, 0.7]);
  var dColr2 = new Float32Array([0.3, 0.7, 0.3]);
  var dColr3 = new Float32Array([0.7, 0.3, 0.3]);

  // Make each 3D shape in its own array of vertices:
  makeCylinder();					// create, fill the cylVerts array				
  makeVase();
  makeSphere(aColr1, aColr2, aColr3);
  makeSphere(bColr1, bColr2, bColr3);
  makeSphere(cColr1, cColr2, cColr3);
  makeSphere(dColr1, dColr2, dColr3);
  makeGroundGrid();				// create, fill the gndVerts array
  // how many floats total needed to store all shapes?
  var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 
	// for surface normals:
	var sq23 = Math.sqrt(2.0/3.0)
	var sq29 = Math.sqrt(2.0/9.0)
	var sq89 = Math.sqrt(8.0/9.0)
	var thrd = 1.0/3.0;
	
	  tetraVerts = new Float32Array([
	// Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
	     // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
	          0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		 sq23,	sq29, thrd,
	     // Node 1 (base: lower rt; red)
	     			c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		sq23,	sq29, thrd,
	     // Node 2 (base: +y axis;  grn)
	     			0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		sq23,	sq29, thrd, 
	// Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
			 // Node 0 (apex, +z axis;  blue)
			 			0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,	 -sq23,	sq29, thrd,
	     // Node 2 (base: +y axis;  grn)
	     			0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,	 -sq23,	sq29, thrd,
	     // Node 3 (base:lower lft; white)
	    			-c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	 -sq23,	sq29,	thrd,
	// Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
			 // Node 0 (apex, +z axis;  blue) 
			 			0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		0.0, -sq89,	thrd,
	    // Node 3 (base:lower lft; white)
	    			-c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 		0.0, -sq89,	thrd,          																							//0.0, 0.0, 0.0, // Normals debug
	     // Node 1 (base: lower rt; red) 
	     			c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		0.0, -sq89,	thrd,
	// Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
	    // Node 3 (base:lower lft; white)
	    			-c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 		0.0, 	0.0, -1.0,
	    // Node 2 (base: +y axis;  grn)
	     			0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		0.0, 	0.0, -1.0,
	    // Node 1 (base: lower rt; red)
	     			c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		0.0, 	0.0, -1.0,
	  ]);

  axisLen = 3;
  axisVerts = new Float32Array([// Drawing Axes: Draw them using gl.LINES drawing primitive;
     0.0,  0.0,  0.0, 1.0,      0.3,  0.3,  0.3,      0.0,  1.0,  0.0, 
     1.3,  0.0,  0.0, 1.0,      1.0,  0.3,  0.3,      0.0,  1.0,  0.0,
// Y axis line: (origin: gray -- endpoint: green      Normal Vector: +z)
     0.0,  0.0,  0.0, 1.0,      0.3,  0.3,  0.3,      0.0,  0.0,  1.0,
     0.0,  1.3,  0.0, 1.0,      0.3,  1.0,  0.3,      0.0,  0.0,  1.0,
// Z axis line: (origin: gray -- endpoint: blue       Normal Vector: +x)
     0.0,  0.0,  0.0, 1.0,      0.3,  0.3,  0.3,      1.0,  0.0,  0.0,
     0.0,  0.0,  1.3, 1.0,      0.3,  0.3,  1.0,      1.0,  0.0,  0.0,
  ]);

  sphAVerts = sphsVerts[0];
  sphBVerts = sphsVerts[1];
  sphCVerts = sphsVerts[2];
  sphDVerts = sphsVerts[3];

  var mySiz = (cylVerts.length + vaseVerts.length + tetraVerts.length + 4*sphAVerts.length + gndVerts.length + axisVerts.length);						  
  // How many vertices total?
  var nn = mySiz / floatsPerVertex;
  console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
  // Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		vaseStart = i;						// next, we'll store the sphere;
	for(j=0; j< vaseVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = vaseVerts[j];
		}
		sphAStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphAVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphAVerts[j];
		}
    sphBStart = i;            // next, we'll store the sphere;
  for(j=0; j< sphBVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = sphBVerts[j];
    }
    sphCStart = i;            // next, we'll store the sphere;
  for(j=0; j< sphCVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = sphCVerts[j];
    }
    sphDStart = i;            // next, we'll store the sphere;
  for(j=0; j< sphDVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = sphDVerts[j];
    }
		gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
		}
		axisStart = i;
	for(j=0; j< axisVerts.length; i++, j++) {
		colorShapes[i] = axisVerts[j];
		}	
    tetraStart = i;           // next, we'll store the sphere;
  for(j=0; j< tetraVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = tetraVerts[j];
    }

  sphsStart = [sphAStart, sphBStart, sphCStart, sphDStart];
  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
      a_Position,   // choose Vertex Shader attribute to fill with data
      4,            // how many values? 1,2,3 or 4.  (we're using x,y,z,w)
      gl.FLOAT,     // data type for each value: usually gl.FLOAT
      false,        // did we supply fixed-point data AND it needs normalizing?
      FSIZE * 10,   // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
      0);           // Offset -- now many bytes from START of buffer to the
                    // value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
                    // Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
    a_Color,        // choose Vertex Shader attribute to fill with data
    3,              // how many values? 1,2,3 or 4. (we're using R,G,B)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 10,     // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
    FSIZE * 4);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w
                    
  gl.enableVertexAttribArray(a_Color);  
                    // Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's normal-vec-input variable;
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if(a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
    a_Normal,         // choose Vertex Shader attribute to fill with data
    3,              // how many values? 1,2,3 or 4. (we're using x,y,z)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 10,     // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
    FSIZE * 7);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w,r,g,b
                    
  gl.enableVertexAttribArray(a_Normal);  
                    // Enable assignment of vertex buffer object's position data
	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function randColr(perc) {
	return 1 - Math.random()*perc;
}

function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var colorPerc = 0.2;
 var ctrColr = new Float32Array([0.7, 0.7, 0.0]);	// dark gray
 var topColr = new Float32Array([0.5, 0.7, 0.0]);	// light green
 var midColr = new Float32Array([0.0, 0.3, 0.0]);	// light blue
 var capVerts = 24;	// # of vertices aroun3d the topmost 'cap' of the shape
 var topRadius = .3;
 var midRadius = .4;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0*height; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=ctrColr[2]*randColr(colorPerc);
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = topRadius*Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = topRadius*Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0*height;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=topColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
    cylVerts[j+7] = 1.0;
    cylVerts[j+8] = 1.0;
    cylVerts[j+9] = 1.0;
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = topRadius*Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = topRadius*Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0*height;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0]*randColr(colorPerc); 
				cylVerts[j+5]=topColr[1]*randColr(colorPerc); 
				cylVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = midRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = midRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0*height;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=midColr[0]*randColr(colorPerc); 
				cylVerts[j+5]=midColr[1]*randColr(colorPerc); 
				cylVerts[j+6]=midColr[2]*randColr(colorPerc);			
		}
    cylVerts[j+7] = 1.0;
    cylVerts[j+8] = 1.0;
    cylVerts[j+9] = 1.0;
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = midRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = midRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0*height;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=midColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=midColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=midColr[2]*randColr(colorPerc);		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0*height; 
			cylVerts[j+3] = 1.0;			// r,g,b = midColr[]
			cylVerts[j+4]=midColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=midColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=midColr[2]*randColr(colorPerc);
		}
	}
}

function makeVase() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var colorPerc = 0.2;
 var ctrColr = new Float32Array([0.30, 0.25, 0.15]);	// brown
 var topColr = new Float32Array([0.19, 0.37, 0.34]);	// light blue
 var midColr = new Float32Array([0.04, 0.4, 0.4]);	// dark blue
 var botColr = new Float32Array([0.00, 0.25, 0.25]);	// dark blue
 var capVerts = 70;	// # of vertices aroun3d the topmost 'cap' of the shape
 var layer1Height = .3;
 var layer2Height = .7;
 var topRadius = 1.3;
 var midRadius = 1.4;		// radius of bottom of cylinder (top always 1.0)
 var botRadius = 1;
 
 // Create a (global) array to hold this cylinder's vertices;
 vaseVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)

	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			vaseVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			vaseVerts[j+1] = 0.0;	
			vaseVerts[j+2] = 1.0*layer1Height; 
			vaseVerts[j+3] = 1.0;			// r,g,b = topColr[]
			vaseVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=ctrColr[2]*randColr(colorPerc);
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			vaseVerts[j  ] = topRadius*Math.cos(Math.PI*(v-1)/capVerts);			// x
			vaseVerts[j+1] = topRadius*Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			vaseVerts[j+2] = 1.0*layer1Height;	// z
			vaseVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			vaseVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=ctrColr[2]*randColr(colorPerc);			
		}
    vaseVerts[j+7] = 1.0;
    vaseVerts[j+8] = 1.0;
    vaseVerts[j+9] = 1.0;
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				vaseVerts[j  ] = topRadius*Math.cos(Math.PI*(v)/capVerts);		// x
				vaseVerts[j+1] = topRadius*Math.sin(Math.PI*(v)/capVerts);		// y
				vaseVerts[j+2] = 1.0*layer1Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=topColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=topColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				vaseVerts[j  ] = midRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				vaseVerts[j+1] = midRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				vaseVerts[j+2] =-1.0*layer1Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=midColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=midColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=midColr[2]*randColr(colorPerc);			
		}
    vaseVerts[j+7] = 1.0;
    vaseVerts[j+8] = 1.0;
    vaseVerts[j+9] = 1.0;
	}
	////
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				vaseVerts[j  ] = midRadius*Math.cos(Math.PI*(v)/capVerts);		// x
				vaseVerts[j+1] = midRadius*Math.sin(Math.PI*(v)/capVerts);		// y
				vaseVerts[j+2] = 1.0*layer2Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=midColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=midColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=midColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				vaseVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				vaseVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				vaseVerts[j+2] =-1.0*layer2Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=botColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=botColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=botColr[2]*randColr(colorPerc);			
		}
    vaseVerts[j+7] = 1.0;
    vaseVerts[j+8] = 1.0;
    vaseVerts[j+9] = 1.0;
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			vaseVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			vaseVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			vaseVerts[j+2] =-1.0*layer2Height;	// z
			vaseVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			vaseVerts[j+4]=botColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=botColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=botColr[2]*randColr(colorPerc);		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			vaseVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			vaseVerts[j+1] = 0.0;	
			vaseVerts[j+2] =-1.0*layer2Height; 
			vaseVerts[j+3] = 1.0;			// r,g,b = botColr[]
			vaseVerts[j+4]=botColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=botColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=botColr[2]*randColr(colorPerc);
		}
    vaseVerts[j+7] = 1.0;
    vaseVerts[j+8] = 1.0;
    vaseVerts[j+9] = 1.0;
	}

}

function makeSphere(colr1, colr2, colr3) {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 100;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts = 100;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var colorPerc = 0.2;
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
  var sliceMiddle = Math.floor(Math.random()*slices);
  var sliceTop = slices - Math.floor(Math.random()*sliceMiddle);

		// Create a (global) array to hold this sphere's vertices:
	  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
											// # of vertices * # of elements needed to store them. 
											// each slice requires 2*sliceVerts vertices except 1st and
											// last ones, which require only 2*sliceVerts-1.
											
		// Create dome-shaped top slice of sphere at z=+1
		// s counts slices; v counts vertices; 
		// j counts array elements (vertices * elements per vertex)
		var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
		var sin0 = 0.0;
		var cos1 = 0.0;
		var sin1 = 0.0;	
		var j = 0;							// initialize our array index
		var isLast = 0;
		var isFirst = 1;
		for(s=0; s<slices; s++) {	// for each slice of the sphere,
			// find sines & cosines for top and bottom of this slice
			if(s==0) {
				isFirst = 1;	// skip 1st vertex of 1st slice.
				cos0 = 1.0; 	// initialize: start at north pole.
				sin0 = 0.0;
			}
			else {					// otherwise, new top edge == old bottom edge
				isFirst = 0;	
				cos0 = cos1;
				sin0 = sin1;
			}								// & compute sine,cosine for new bottom edge.
			cos1 = Math.cos((s+1)*sliceAngle);
			sin1 = Math.sin((s+1)*sliceAngle);
			// go around the entire slice, generating TRIANGLE_STRIP verts
			// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
			if(s==slices-1) isLast=1;	// skip last vertex of last slice.
			for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
				if(v%2==0)
				{				// put even# vertices at the the slice's top edge
								// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
								// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
					sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
					sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
					sphVerts[j+2] = cos0;		
					sphVerts[j+3] = 1.0;			
				}
				else { 	// put odd# vertices around the slice's lower edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
					sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
					sphVerts[j+2] = cos1;																				// z
					sphVerts[j+3] = 1.0;																				// w.		
				}

			    var colrA = randColr(colorPerc);
			    var colrB = randColr(colorPerc);

				if(s < sliceTop) {	// finally, set some interesting colors for vertices:
					sphVerts[j+4]=colr1[0]*colrA; 
					sphVerts[j+5]=colr1[1]*colrB; 
					sphVerts[j+6]=colr1[2];	
					}
				else if(s < sliceMiddle) {
					sphVerts[j+4]=colr2[0]*colrA; 
					sphVerts[j+5]=colr2[1]*colrB; 
					sphVerts[j+6]=colr2[2];	
				}
				else {
					sphVerts[j+4]=colr3[0]*colrA;// colr[0]; 
					sphVerts[j+5]=colr3[1]*colrB;// colr[1]; 
					sphVerts[j+6]=colr3[2];// colr[2];					
				}
        sphVerts[j+7] = 1.0;
        sphVerts[j+8] = 1.0;
        sphVerts[j+9] = 1.0;
			}
		}
    sphsVerts.push(sphVerts);
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
    gndVerts[j+7] = 1.0;
    gndVerts[j+8] = 1.0;
    gndVerts[j+9] = 1.0;
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
    gndVerts[j+7] = 0.0;
    gndVerts[j+8] = 0.0;
    gndVerts[j+9] = 1.0;
	}
}

//var eye  = {x: 1.0, y: 1.0, z: 3.0};
//var look = {x: -2.0, y: -3.0, z: 0.0};

var first = true;
var eye  = {x: 5.0, y: 0.0, z: 3.0};
var look = {x: 0.0, y: 0.0, z:-0.5};
var up   = {x: 0.0, y: 0.0, z: 1.0};
var d;
calcD();
var dLength = Math.sqrt(Math.pow(d.x, 2) + Math.pow(d.y, 2));
var theta = Math.acos(d.x/dLength);
turnHorizontally(true);

function calcD() {
  d = {x: (look.x-eye.x), y: (look.y-eye.y), z: (look.z-eye.z)};
}

function forward(isForward, vec, vel) {
  var vel = (isForward) ? vel : -vel;
  eye = {x: (eye.x + vel*vec.x), y: (eye.y + vel*vec.y), z: (eye.z + vel*vec.z)};
  look = {x: (look.x + vel*vec.x), y: (look.y + vel*vec.y), z: (look.z + vel*vec.z)};
  calcD();
  return;
}

function sideways(isRight) {
  var cross = {
    x: (d.y*up.z - d.z*up.y),
    y: (d.z*up.x - d.x*up.z),
    z: (d.x*up.y - d.y*up.x)
  };
  forward(isRight, cross, velS);
}

function turnHorizontally(isRight) {
  var thetaInc = (isRight) ? -thetaStep : thetaStep;
  theta = theta + thetaInc;
  var cos = Math.cos(theta);
  var sin = Math.sin(theta);
  look = {x: (eye.x + dLength*cos), y: (eye.y + dLength*sin), z: look.z};
  calcD();
  return;
 }

 function turnVertically(isUp) {
  var tilt = (isUp) ? tiltStep : -tiltStep;
  look.z = look.z + tilt;
  calcD();
  return;
 }

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, bool, u_Bool) {

  var near = 1.0;
  var far = 1000.0;
	  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.viewport(0,                            // Viewport lower-left corner
			  0,							// (x,y) location(in pixels)
			  canvas.width/2, 	    // viewport width, height.
			  canvas.height);
  modelMatrix.setIdentity();    // DEFINE 'world-space' coords.
  modelMatrix.perspective(35, (canvas.width/2)/canvas.height, near, far);
  // MAKE a temporary view matrix that is still close to the origin and
  // won't lost sight of our current CVV contents.
  modelMatrix.lookAt(eye.x, eye.y, eye.z,    // center of projection
  					         look.x, look.y, look.z, // look-at proint
  					         up.x, up.y, up.z); 
  modelMatrix.scale(1,1,-1);
  modelMatrix.rotate(180, 1, 0, 0);
  pushMatrix(modelMatrix);     // SAVE worls coord system.
//==============================================================================

	// Draw the scene:
  gl.uniform1f(u_Bool, 1.0);
  drawTetra(gl, currentAngle, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, u_Bool);
  drawPlant(gl, currentAngle, modelMatrix, u_ModelMatrix);
  drawSphere(gl, modelMatrix, u_ModelMatrix, 0, 1, 1); 
  drawSphere(gl, modelMatrix, u_ModelMatrix, 1, -1, -1); 
  drawSphere(gl, modelMatrix, u_ModelMatrix, 2, 1, -1); 
  drawSphere(gl, modelMatrix, u_ModelMatrix, 3, -1, 1); 
  drawGrid(gl, modelMatrix, u_ModelMatrix);
  drawAxis(gl, modelMatrix, u_ModelMatrix, 1, 0, -2, 0.3);
  //============================================================================
  //

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);

  gl.viewport(canvas.width/2,      // Viewport lower-left corner
		      0,							// (x,y) location(in pixels)
		      canvas.width/2, 	    // viewport width, height.
		      canvas.height);
  modelMatrix.setIdentity();    // DEFINE 'world-space' coords.
  var zoom = 0.007;
  var orthoZ = (far-near)/3;
  modelMatrix.ortho(-zoom*(canvas.width/4),
                    zoom*(canvas.width/4),
                    -zoom*(canvas.height/2),
                    zoom*(canvas.height/2),
                    -(orthoZ/2),
                    (orthoZ/2));
  modelMatrix.lookAt(eye.x, eye.y, eye.z,    // center of projection
                     look.x, look.y, look.z, // look-at proint
                     up.x, up.y, up.z); 
  modelMatrix.scale(1,1,-1);
  modelMatrix.rotate(180, 1, 0, 0);
  pushMatrix(modelMatrix);     // SAVE worls coord system.
//==============================================================================

	// Draw the scene:
  gl.uniform1f(u_Bool, 1.0);
  drawTetra(gl, currentAngle, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, u_Bool);
  drawPlant(gl, currentAngle, modelMatrix, u_ModelMatrix);
  drawSphere(gl, modelMatrix, u_ModelMatrix, 0, 1, 1); 
  drawSphere(gl, modelMatrix, u_ModelMatrix, 1, -1, -1); 
  drawSphere(gl, modelMatrix, u_ModelMatrix, 2, 1, -1); 
  drawSphere(gl, modelMatrix, u_ModelMatrix, 3, -1, 1);
  drawGrid(gl, modelMatrix, u_ModelMatrix);
  drawAxis(gl, modelMatrix, u_ModelMatrix, 1, 0, -2, 0.3);
  //============================================================================
  //
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function drawTetra(myGl, myCurrentAngle, myModelMatrix, u_MyModelMatrix, myNormalMatrix, u_MyNormalMatrix, u_MyBool) {
  //-------Create Spinning Tetrahedron-----------------------------------------

  myModelMatrix = popMatrix();    // RESTORE 'world' drawing coords.
  pushMatrix(myModelMatrix);
  // (Projection and View matrices, if you had them, would go here)
  myModelMatrix.translate(0,1, 1);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 						// convert to left-handed coord sys
  																				// to match WebGL display canvas.
																				// (THIS STILL PUZZLES ME!)
  myModelMatrix.scale(0.5, 0.5, 0.5);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
  myModelMatrix.rotate(myCurrentAngle, 0, 1, 0);  // spin drawing axes on Y axis;

	//Find inverse transpose of modelMatrix:
	myNormalMatrix.setInverseOf(myModelMatrix);
	myNormalMatrix.transpose();
	
  
  //-----SEND to GPU & Draw
  //the first set of vertices stored in our VBO:
  		// Pass our current Model matrix to the vertex shaders:
  myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
  		// Pass our current Normal matrix to the vertex shaders:
  myGl.uniformMatrix4fv(u_MyNormalMatrix, false, myModelMatrix.elements);
  		// Draw triangles: start at vertex 0 and draw 12 vertices
  myGl.drawArrays(myGl.TRIANGLES,
  				  tetraStart/floatsPerVertex, // start at this vertex number, and
  				  tetraVerts.length/10);	// draw this many vertices.

  myGl.uniform1f(u_MyBool, 0.0);
  drawAxis(myGl, myModelMatrix, u_MyModelMatrix, 1, 0, 0, 1);
}

function drawPlant(myGl, myCurrentAngle, myModelMatrix, u_MyModelMatrix) {
//==============================================================================
  var plantCenter_x = 2;
  var plantCenter_y = 2;
  var plantCenter_z = 0.5;
  var stemHeight = 0.05+0.15*scalar;
  var leaveHeight = height-0.05*scalar;
  var plantRotationAngle = 0;
  var a = 1;
  var b = 0;
  var c = 0;

  myModelMatrix = popMatrix();    // RESTORE 'world' drawing coords.
  //============================================================================
  //
  pushMatrix(myModelMatrix);
  //-------Draw Vase:
  //myModelMatrix.translate(plantCenter_x, plantCenter_y, plantCenter_z);
  //myModelMatrix.rotate(180, a, b, c);								
  myModelMatrix.scale(0.2, 0.2, 0.2);
  myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
  myGl.drawArrays(myGl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							vaseStart/floatsPerVertex, // start at this vertex number, and
  							vaseVerts.length/floatsPerVertex);	// draw this many vertices.

  myModelMatrix = popMatrix();
  pushMatrix(myModelMatrix);
  drawAxis(myGl, myModelMatrix, u_MyModelMatrix, 0.7, 0, 0, 0);
  
  var trans_x = [0, -0.1, 0.1, 0.1, -0.1];
  var trans_y = [0, -0.1, -0.1, 0.1, 0.1];
  var rot_x = [0, -1, -1, 1, 1];
  var rot_y = [0, 1, -1, -1, 1];
  
  for (j=0; j<5; j++) {
	  myModelMatrix = popMatrix();
	  pushMatrix(myModelMatrix);
	  //-------Draw Branches:
	  myModelMatrix.translate(trans_x[j],trans_y[j], stemHeight);
	  myModelMatrix.rotate(plantRotationAngle*.3, 1, 0, 0);											
	  myModelMatrix.scale(0.2*scalar, 0.2*scalar, 0.2*scalar);
	  myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
	  myGl.drawArrays(myGl.TRIANGLE_STRIP,				// use this drawing primitive, and
	  							cylStart/floatsPerVertex, // start at this vertex number, and
	  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
	  for (i=0; i<5; i++){
	  	myModelMatrix.translate(0, 0, 1.5*leaveHeight); 	
		  myModelMatrix.scale(0.7*scalar,0.7*scalar,0.7*scalar);																			
		  myModelMatrix.rotate(myCurrentAngle, rot_x[j], rot_y[j], 0);
		  myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
		  myGl.drawArrays(myGl.TRIANGLE_STRIP,				// use this drawing primitive, and
		  							cylStart/floatsPerVertex, // start at this vertex number, and
		  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
	  }	
   }
}

function drawSphere(myGl, myModelMatrix, u_MyModelMatrix, index, x, y) {
  myModelMatrix = popMatrix();
  pushMatrix(myModelMatrix);	
  //--------Draw Spinning Neptune
  myModelMatrix.translate(x, y, 0.3); 
  var size = 0.2;
  myModelMatrix.scale(size,size,-size);		
  myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
  myGl.drawArrays(myGl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							sphsStart[index]/floatsPerVertex,	// start at this vertex number, and 
  							sphsVerts[index].length/floatsPerVertex);
  drawAxis(myGl, myModelMatrix, u_MyModelMatrix, 1.5, 0, 0, 0);
}

function drawGrid(myGl, myModelMatrix, u_MyModelMatrix) {
	//---------Draw Ground Plane, without spinning.
	// position it.
  myModelMatrix = popMatrix();
	pushMatrix(myModelMatrix); 
	myModelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:
//	modelMatrix.rotate(-60.0, 1,0,0 );
	// Drawing:
	// Pass our current matrix to the vertex shaders:
  myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
  // Draw just the ground-plane's vertices
  myGl.drawArrays(myGl.LINES, 								// use this drawing primitive, and
  						  gndStart/floatsPerVertex,	// start at this vertex number, and
  						  gndVerts.length/floatsPerVertex);	// draw this many vertices.
}

function drawAxis(myGl, myModelMatrix, u_MyModelMatrix, len, x, y, z) {
  myModelMatrix.scale(len, len, len);
	myModelMatrix.translate(x, y, z);
	myGl.uniformMatrix4fv(u_MyModelMatrix, false, myModelMatrix.elements);
  // Draw just the ground-plane's vertices
  myGl.drawArrays(myGl.LINES, 								// use this drawing primitive, and
  						  axisStart/floatsPerVertex,	// start at this vertex number, and
  						  axisVerts.length/floatsPerVertex);	// draw this many vertices.
}

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  now = Date.now();
  elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(direction >= 0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(direction < 0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  if(scalar > 1 || scalar <= 0) direction = -direction;
  scalar += direction * speed;
  return newAngle %= 360;
}

function animateRotation(angle) {
//==============================================================================
  var newAngle = angle + (SUN_ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function nextShape() {
	shapeNum += 1;
	if(shapeNum >= shapeMax) shapeNum = 0;
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}

function myKeyDown(ev) {
  console.log("===NEW KEY=====");
  switch(ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
  //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.
      case 32:  // spacebar
      break;
    case 37:    // left-arrow key
      sideways(false);
      break;
    case 38:    // up-arrow key
      forward(true, d, velF);
      break;
    case 39:    // right-arrow key
      sideways(true);
      break;
    case 40:    // down-arrow key
      forward(false, d, velF);
      break; 
    case 65:    // a
      turnHorizontally(false);
      break;
    case 68:    // d
      turnHorizontally(true);
      break;
    case 83:    // s
      turnVertically(false);
      break;
    case 87:    // w
      turnVertically(true);
      break;
    default:
      break;
  }
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.
  console.log('myKeyPress():keyCode=' +ev.keyCode  +', charCode=' +ev.charCode+
                        ', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
                        ', altKey='   +ev.altKey   +
                        ', metaKey(Command key or Windows key)='+ev.metaKey);
}


function drawResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  var nuGL = getWebGLContext(nuCanvas);             // and context:

  //Report our current browser-window contents:

  console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);   
 console.log('Browser window: innerWidth,innerHeight=', 
                                innerWidth, innerHeight); // http://www.w3schools.com/jsref/obj_window.asp

  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight*3/4;
  // IMPORTANT!  Need a fresh drawing in the re-sized viewports.
  draw(nuGL, n, currentAngle, g_modelMatrix, g_u_ModelMatrix, g_normalMatrix, g_u_NormalMatrix);       // draw in all viewports.
}

