let currentTool = "rectangle";
let currentRole = "window_frame";
let shapes = [];

let canvasW = 900;
let canvasH = 550;

let clearBtn;
let exportBtn;
let generateBtn;
let applyRoleBtn;
let deleteSelectedBtn;

let roleSelect;

let isDrawing = false;
let startX = 0;
let startY = 0;
let previewShape = null;

let selectedIndex = -1;
let isDraggingShape = false;
let lastMouseX = 0;
let lastMouseY = 0;

let sketchLayer;

let sketchPreviewTitle;
let sketchPreviewImg;

let resultTitle;
let resultImg;

let promptInfoP;
let statusP;

const ROLE_OPTIONS = [
  "window_frame",
  "mannequin",
  "plinth",
  "backdrop_panel",
  "framed_display",
  "curtain_drape",
  "floral_cluster",
  "decor_cluster",
  "lighting_glow",
  "display_object",
  "folded_prop",
  "frame_bar",
  "hanging_string"
];

function setup() {
  document.body.style.margin = "20px";
  document.body.style.background = "#dcdcdc";
  document.body.style.fontFamily = "sans-serif";

  createP(
    "Select a shape tool and a semantic role. Drag on empty canvas to create a shape, or drag an existing shape to move it."
  );

  createToolButton("Circle", "circle", 20);
  createToolButton("Rectangle", "rectangle", 110);
  createToolButton("Triangle", "triangle", 260);
  createToolButton("Line", "line", 380);

  let roleLabel = createSpan("Role: ");
  roleLabel.position(500, 74);

  roleSelect = createSelect();
  roleSelect.position(545, 70);
  for (let r of ROLE_OPTIONS) {
    roleSelect.option(r);
  }
  roleSelect.selected(currentRole);
  roleSelect.changed(() => {
    currentRole = roleSelect.value();
  });

  applyRoleBtn = createButton("Apply Role to Selected");
  applyRoleBtn.position(705, 70);
  applyRoleBtn.mousePressed(() => {
    if (selectedIndex !== -1) {
      shapes[selectedIndex].role = roleSelect.value();
    }
  });

  let c = createCanvas(canvasW, canvasH);
  c.position(20, 120);

  sketchLayer = createGraphics(canvasW, canvasH);

  clearBtn = createButton("Clear");
  clearBtn.position(20, 120 + canvasH + 20);
  clearBtn.mousePressed(() => {
    shapes = [];
    previewShape = null;
    isDrawing = false;
    isDraggingShape = false;
    selectedIndex = -1;
    clearSketchPreview();
    clearResultPreview();
    promptInfoP.html("");
    statusP.html("Canvas cleared.");
  });

  exportBtn = createButton("Export Sketch");
  exportBtn.position(90, 120 + canvasH + 20);
  exportBtn.mousePressed(() => {
    renderSketchLayer();
    save(sketchLayer, "sketch_control.png");
  });

  generateBtn = createButton("Generate");
  generateBtn.position(200, 120 + canvasH + 20);
  generateBtn.mousePressed(generateImageFromBackend);

  deleteSelectedBtn = createButton("Delete Selected");
  deleteSelectedBtn.position(290, 120 + canvasH + 20);
  deleteSelectedBtn.mousePressed(() => {
    if (selectedIndex !== -1) {
      shapes.splice(selectedIndex, 1);
      selectedIndex = -1;
    }
  });

  statusP = createP("Ready.");
  statusP.position(20, 120 + canvasH + 48);
  statusP.style("margin", "0");
  statusP.style("font-size", "13px");
  statusP.style("color", "#333");

  promptInfoP = createP("");
  promptInfoP.position(20, 120 + canvasH + 75);
  promptInfoP.style("width", "860px");
  promptInfoP.style("font-size", "13px");
  promptInfoP.style("color", "#222");

  sketchPreviewTitle = createP("Sketch Preview");
  sketchPreviewTitle.position(950, 95);
  sketchPreviewTitle.style("font-weight", "600");
  sketchPreviewTitle.style("margin", "0");

  sketchPreviewImg = createImg("", "Sketch Preview");
  sketchPreviewImg.position(950, 120);
  sketchPreviewImg.size(320, 196);
  sketchPreviewImg.style("border", "1px solid #999");
  sketchPreviewImg.style("background", "#fff");
  sketchPreviewImg.hide();

  resultTitle = createP("Generated Result");
  resultTitle.position(950, 340);
  resultTitle.style("font-weight", "600");
  resultTitle.style("margin", "0");

  resultImg = createImg("", "Generated Result");
  resultImg.position(950, 365);
  resultImg.size(320, 196);
  resultImg.style("border", "1px solid #999");
  resultImg.style("background", "#fff");
  resultImg.hide();
}

function draw() {
  background(255);

  rectMode(CORNER);
  noStroke();
  fill(255);
  rect(0, 0, width, height);

  stroke(180);
  strokeWeight(1);
  noFill();
  rect(0, 0, width, height);

  noStroke();
  fill(30);
  textSize(16);
  textAlign(LEFT, TOP);
  text("Current Tool: " + currentTool, 20, 20);

  fill(100);
  textSize(13);
  text("Current Role: " + currentRole, 20, 46);
  text("Recommended layout: frame + mannequin + plinth + backdrop + decor.", 20, 66);

  drawGuideHints();

  for (let i = 0; i < shapes.length; i++) {
    drawShape(shapes[i], false, i === selectedIndex);
    drawShapeRoleLabel(shapes[i], i === selectedIndex);
  }

  if (previewShape) {
    drawShape(previewShape, true, false);
    drawShapeRoleLabel(previewShape, false);
  }
}

function drawGuideHints() {
  push();
  noFill();
  stroke(220);
  strokeWeight(1);

  rect(70, 100, 760, 400);

  rect(400, 180, 110, 220);

  rect(320, 420, 260, 60);

  rect(250, 130, 360, 270);

  pop();

  push();
  noStroke();
  fill(185);
  textSize(11);
  textAlign(CENTER, CENTER);
  text("window_frame", 450, 95);
  text("backdrop_panel", 430, 125);
  text("mannequin / framed_display", 455, 290);
  text("plinth", 450, 450);
  text("decor / floral", 220, 445);
  text("lighting_glow", 720, 150);
  pop();
}

function mousePressed() {
  if (!isInsideCanvas(mouseX, mouseY)) return;

  let hitIndex = getShapeAt(mouseX, mouseY);

  if (hitIndex !== -1) {
    selectedIndex = hitIndex;
    isDraggingShape = true;
    isDrawing = false;
    previewShape = null;
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    roleSelect.selected(shapes[selectedIndex].role || "decor_cluster");
    currentRole = roleSelect.value();
  } else {
    selectedIndex = -1;
    isDrawing = true;
    isDraggingShape = false;
    startX = mouseX;
    startY = mouseY;
    previewShape = createShapeFromDrag(currentTool, startX, startY, mouseX, mouseY);
  }
}

function mouseDragged() {
  if (isDraggingShape && selectedIndex !== -1) {
    let currentX = constrain(mouseX, 0, width);
    let currentY = constrain(mouseY, 0, height);

    let dx = currentX - lastMouseX;
    let dy = currentY - lastMouseY;

    moveShape(shapes[selectedIndex], dx, dy);

    lastMouseX = currentX;
    lastMouseY = currentY;
    return;
  }

  if (isDrawing) {
    let currentX = constrain(mouseX, 0, width);
    let currentY = constrain(mouseY, 0, height);
    previewShape = createShapeFromDrag(currentTool, startX, startY, currentX, currentY);
  }
}

function mouseReleased() {
  if (isDraggingShape) {
    isDraggingShape = false;
    return;
  }

  if (isDrawing) {
    let endX = constrain(mouseX, 0, width);
    let endY = constrain(mouseY, 0, height);

    let finalShape = createShapeFromDrag(currentTool, startX, startY, endX, endY);

    if (isValidShape(finalShape)) {
      shapes.push(finalShape);
      selectedIndex = shapes.length - 1;
    }

    isDrawing = false;
    previewShape = null;
  }
}

function isInsideCanvas(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function createToolButton(label, toolName, x) {
  let btn = createButton(label);
  btn.position(x, 70);
  btn.mousePressed(() => {
    currentTool = toolName;
  });
}

function createShapeFromDrag(type, x1, y1, x2, y2) {
  if (type === "circle") {
    let r = dist(x1, y1, x2, y2);
    return {
      type: "circle",
      role: currentRole,
      x: x1,
      y: y1,
      r: r
    };
  }

  if (type === "rectangle") {
    let left = min(x1, x2);
    let top = min(y1, y2);
    let w = abs(x2 - x1);
    let h = abs(y2 - y1);

    return {
      type: "rectangle",
      role: currentRole,
      x: left,
      y: top,
      w: w,
      h: h
    };
  }

  if (type === "triangle") {
    let left = min(x1, x2);
    let right = max(x1, x2);
    let top = min(y1, y2);
    let bottom = max(y1, y2);

    return {
      type: "triangle",
      role: currentRole,
      x1: (left + right) / 2,
      y1: top,
      x2: left,
      y2: bottom,
      x3: right,
      y3: bottom
    };
  }

  if (type === "line") {
    return {
      type: "line",
      role: currentRole,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2
    };
  }
}

function isValidShape(s) {
  if (!s) return false;

  if (s.type === "circle") {
    return s.r > 5;
  }

  if (s.type === "rectangle") {
    return s.w > 5 && s.h > 5;
  }

  if (s.type === "triangle") {
    let base = dist(s.x2, s.y2, s.x3, s.y3);
    let h = abs(s.y2 - s.y1);
    return base > 5 && h > 5;
  }

  if (s.type === "line") {
    return dist(s.x1, s.y1, s.x2, s.y2) > 5;
  }

  return false;
}

function moveShape(s, dx, dy) {
  if (s.type === "circle") {
    s.x += dx;
    s.y += dy;
  }

  if (s.type === "rectangle") {
    s.x += dx;
    s.y += dy;
  }

  if (s.type === "triangle") {
    s.x1 += dx; s.y1 += dy;
    s.x2 += dx; s.y2 += dy;
    s.x3 += dx; s.y3 += dy;
  }

  if (s.type === "line") {
    s.x1 += dx; s.y1 += dy;
    s.x2 += dx; s.y2 += dy;
  }
}

function getShapeAt(px, py) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (pointInShape(px, py, shapes[i])) {
      return i;
    }
  }
  return -1;
}

function pointInShape(px, py, s) {
  if (s.type === "circle") {
    return dist(px, py, s.x, s.y) <= s.r;
  }

  if (s.type === "rectangle") {
    return px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h;
  }

  if (s.type === "triangle") {
    return pointInTriangle(px, py, s.x1, s.y1, s.x2, s.y2, s.x3, s.y3);
  }

  if (s.type === "line") {
    return pointNearLine(px, py, s.x1, s.y1, s.x2, s.y2, 8);
  }

  return false;
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  let area = triangleArea(x1, y1, x2, y2, x3, y3);
  let a1 = triangleArea(px, py, x2, y2, x3, y3);
  let a2 = triangleArea(x1, y1, px, py, x3, y3);
  let a3 = triangleArea(x1, y1, x2, y2, px, py);

  return abs(area - (a1 + a2 + a3)) < 0.5;
}

function triangleArea(x1, y1, x2, y2, x3, y3) {
  return abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
}

function pointNearLine(px, py, x1, y1, x2, y2, threshold) {
  let d = dist(x1, y1, x2, y2);
  if (d === 0) return dist(px, py, x1, y1) <= threshold;

  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (d * d);
  t = constrain(t, 0, 1);

  let closestX = x1 + t * (x2 - x1);
  let closestY = y1 + t * (y2 - y1);

  return dist(px, py, closestX, closestY) <= threshold;
}

function getRoleColor(role) {
  const map = {
    window_frame: 160,
    mannequin: 110,
    plinth: 135,
    backdrop_panel: 200,
    framed_display: 145,
    curtain_drape: 215,
    floral_cluster: 190,
    decor_cluster: 175,
    lighting_glow: 225,
    display_object: 150,
    folded_prop: 170,
    frame_bar: 120,
    hanging_string: 100
  };

  return map[role] !== undefined ? map[role] : 180;
}

function drawShape(s, isPreview, isSelected) {
  if (isPreview) {
    stroke(30, 30, 30, 140);
    strokeWeight(2);
    fill(220, 230, 255, 80);
  } else if (isSelected) {
    stroke(255, 120, 0);
    strokeWeight(3);
    fill(220, 230, 255, 200);
  } else {
    stroke(30);
    strokeWeight(2);
    fill(220, 230, 255, 180);
  }

  if (s.type === "circle") {
    ellipse(s.x, s.y, s.r * 2, s.r * 2);
  }

  if (s.type === "rectangle") {
    rectMode(CORNER);
    rect(s.x, s.y, s.w, s.h);
  }

  if (s.type === "triangle") {
    triangle(s.x1, s.y1, s.x2, s.y2, s.x3, s.y3);
  }

  if (s.type === "line") {
    noFill();
    line(s.x1, s.y1, s.x2, s.y2);
  }
}

function drawShapeRoleLabel(s, isSelected) {
  let c = getShapeCenter(s);
  if (!c) return;

  noStroke();
  fill(isSelected ? "#d35400" : "#444");
  textSize(11);
  textAlign(CENTER, CENTER);
  text(s.role || "no-role", c.x, c.y);
}

function getShapeCenter(s) {
  if (s.type === "circle") {
    return { x: s.x, y: s.y };
  }

  if (s.type === "rectangle") {
    return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
  }

  if (s.type === "triangle") {
    return {
      x: (s.x1 + s.x2 + s.x3) / 3,
      y: (s.y1 + s.y2 + s.y3) / 3
    };
  }

  if (s.type === "line") {
    return {
      x: (s.x1 + s.x2) / 2,
      y: (s.y1 + s.y2) / 2
    };
  }

  return null;
}

function renderSketchLayer() {
  
  sketchLayer.background(255);
  sketchLayer.noStroke();

  for (let s of shapes) {
    drawSketchShape(sketchLayer, s);
  }
}

function drawSketchShape(g, s) {
  let gray = getRoleColor(s.role);
  g.fill(gray);

  if (s.type === "circle") {
    g.ellipse(s.x, s.y, s.r * 2, s.r * 2);
  }

  if (s.type === "rectangle") {
    g.rectMode(CORNER);
    g.rect(s.x, s.y, s.w, s.h);
  }

  if (s.type === "triangle") {
    g.triangle(s.x1, s.y1, s.x2, s.y2, s.x3, s.y3);
  }

  if (s.type === "line") {
    g.stroke(gray);
    g.strokeWeight(5);
    g.line(s.x1, s.y1, s.x2, s.y2);
    g.noStroke();
  }
}

async function generateImageFromBackend() {
  if (shapes.length === 0) {
    statusP.html("Please draw at least one shape first.");
    return;
  }

  renderSketchLayer();

  let dataUrl = sketchLayer.elt.toDataURL("image/png");
  showSketchPreview(dataUrl);

  const payload = {
    shapes: shapes,
    sketch: dataUrl,
    strength: 0.82,
    steps: 35,
    guidance_scale: 8.0,
    seed: null
  };

  statusP.html("Generating...");

  try {
    const res = await fetch("http://127.0.0.1:8000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("backend result:", data);

    if (data.ok && data.image_url) {
      resultImg.attribute("src", data.image_url + "?t=" + Date.now());
      resultImg.show();
      promptInfoP.html("<b>Prompt used:</b> " + data.prompt);
      statusP.html("Generation complete.");
    } else {
      statusP.html("Backend returned an unexpected result.");
    }
  } catch (err) {
    console.error("generate failed:", err);
    statusP.html("Generate failed. Check backend terminal / CORS / model path.");
  }
}

function showSketchPreview(dataUrl) {
  sketchPreviewImg.attribute("src", dataUrl);
  sketchPreviewImg.show();
}

function clearSketchPreview() {
  sketchPreviewImg.attribute("src", "");
  sketchPreviewImg.hide();
}

function clearResultPreview() {
  resultImg.attribute("src", "");
  resultImg.hide();
}