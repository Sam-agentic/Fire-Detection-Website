/* ============================================================
   SENTINEL FIRE DETECTION
   FRONTEND ENGINE
   ============================================================

   Features:

   - Mouse-following eyes
   - Animated skeleton centipede
   - Creature AI behavior
   - Eye interaction
   - Image detection
   - Video detection
   - Live camera
   - WebSocket detection
   - Drag & drop
   - Backend health check
============================================================ */


document.addEventListener("DOMContentLoaded", () => {


  /* ==========================================================
     1. CONFIGURATION
  ========================================================== */

  const API_BASE = "http://127.0.0.1:8000";

  const API_KEY =
    "your-secret-key-change-this-later";

  const MAX_FILE_SIZE_MB = 10;

  const MAX_FILE_SIZE_BYTES =
    MAX_FILE_SIZE_MB * 1024 * 1024;


  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];


  const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/x-msvideo",
    "video/quicktime"
  ];


  /* ==========================================================
     2. HELPERS
  ========================================================== */

  const $ = (id) =>
    document.getElementById(id);


  function showError(message) {

    console.error(message);

    alert(message);

  }


  async function parseResponse(response) {

    const type =
      response.headers.get("content-type") || "";

    if (type.includes("application/json")) {

      return await response.json();

    }

    const text =
      await response.text();

    return {
      detail:
        text ||
        "Server returned an invalid response."
    };

  }


  /* ==========================================================
     3. MASCOT EYES
  ========================================================== */

  const eyeLeft =
    $("eyeLeft");

  const eyeRight =
    $("eyeRight");


  let mouseX =
    window.innerWidth / 2;

  let mouseY =
    window.innerHeight / 2;


  document.addEventListener(
    "mousemove",
    (event) => {

      mouseX = event.clientX;

      mouseY = event.clientY;

      moveEye(
        eyeLeft,
        mouseX,
        mouseY
      );

      moveEye(
        eyeRight,
        mouseX,
        mouseY
      );

    }
  );


  function moveEye(
    eye,
    x,
    y
  ) {

    if (!eye) return;

    const pupil =
      eye.querySelector(".pupil");

    if (!pupil) return;

    const rect =
      eye.getBoundingClientRect();

    const centerX =
      rect.left +
      rect.width / 2;

    const centerY =
      rect.top +
      rect.height / 2;


    const dx =
      x - centerX;

    const dy =
      y - centerY;


    const distance =
      Math.hypot(dx, dy);


    if (distance < 1) return;


    const angle =
      Math.atan2(dy, dx);


    const movement =
      Math.min(
        7,
        distance / 25
      );


    pupil.style.transform =
      `translate(
        ${Math.cos(angle) * movement}px,
        ${Math.sin(angle) * movement}px
      )`;

  }


  /* ==========================================================
     4. SKELETON CENTIPEDE
  ========================================================== */

  const creatureCanvas =
    $("creatureCanvas");

  const creatureCtx =
    creatureCanvas.getContext("2d");


  function resizeCreatureCanvas() {

    const dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );


    creatureCanvas.width =
      window.innerWidth * dpr;

    creatureCanvas.height =
      window.innerHeight * dpr;


    creatureCanvas.style.width =
      window.innerWidth + "px";

    creatureCanvas.style.height =
      window.innerHeight + "px";


    creatureCtx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

  }


  resizeCreatureCanvas();

  window.addEventListener(
    "resize",
    resizeCreatureCanvas
  );


  /* ==========================================================
     CREATURE STATE
  ========================================================== */

  const creature = {

    x:
      window.innerWidth * .72,

    y:
      window.innerHeight * .60,


    angle: Math.PI,

    speed: 0,

    targetX:
      window.innerWidth * .72,

    targetY:
      window.innerHeight * .60,


    emotion: "curious",

    emotionTimer: 0,

    activityTimer: 0,

    blinkTimer: 0,

    blink: false,

    shake: 0

  };


  /* ==========================================================
     BODY
  ========================================================== */

  const SEGMENT_COUNT = 13;

  const segments = [];


  for (
    let i = 0;
    i < SEGMENT_COUNT;
    i++
  ) {

    segments.push({

      x:
        creature.x -
        i * 13,

      y:
        creature.y,

      angle:
        creature.angle,

      phase:
        Math.random() * Math.PI * 2

    });

  }


  /* ==========================================================
     EMOTIONS
  ========================================================== */

  const emotionText =
    $("emotionText");

  const emotionBox =
    $("creatureEmotion");


  const emotions = {

    curious: "👀 curious",

    scared: "😨 WHOA!",

    angry: "😡 BACK OFF!",

    surprised: "😳 WHAT?!",

    watching: "👁 watching...",

    mischievous: "😈 hehe",

    sleepy: "😴 ...",

    excited: "⚡ excited!"

  };


  function setEmotion(
    emotion,
    duration = 1500
  ) {

    creature.emotion =
      emotion;

    creature.emotionTimer =
      duration;

    if (emotionText) {

      emotionText.textContent =
        emotions[emotion] ||
        emotion;

    }


    if (emotionBox) {

      emotionBox.classList.add(
        "visible"
      );

    }

  }


  function hideEmotion() {

    if (emotionBox) {

      emotionBox.classList.remove(
        "visible"
      );

    }

  }


  /* ==========================================================
     DISTANCE TO EYES
  ========================================================== */

  function getEyesCenter() {

    if (!eyeLeft || !eyeRight) {

      return null;

    }


    const a =
      eyeLeft.getBoundingClientRect();

    const b =
      eyeRight.getBoundingClientRect();


    return {

      x:
        (a.left + b.right) / 2,

      y:
        (a.top + b.bottom) / 2

    };

  }


  /* ==========================================================
     RANDOM CREATURE ACTIVITIES
  ========================================================== */

  function chooseRandomActivity() {

    const activities = [

      "wander",

      "look",

      "wander",

      "wander",

      "sleep",

      "excited",

      "mischief"

    ];


    const activity =
      activities[
        Math.floor(
          Math.random() *
          activities.length
        )
      ];


    if (
      activity ===
      "wander"
    ) {

      creature.targetX =
        mouseX +
        (Math.random() - .5) *
        260;

      creature.targetY =
        mouseY +
        (Math.random() - .5) *
        260;

      creature.speed =
        .5 +
        Math.random() * .7;

      setEmotion(
        "curious",
        800
      );

    }


    else if (
      activity ===
      "look"
    ) {

      setEmotion(
        "watching",
        1800
      );

    }


    else if (
      activity ===
      "sleep"
    ) {

      setEmotion(
        "sleepy",
        2500
      );

    }


    else if (
      activity ===
      "excited"
    ) {

      creature.shake =
        10;

      setEmotion(
        "excited",
        1200
      );

    }


    else if (
      activity ===
      "mischief"
    ) {

      setEmotion(
        "mischievous",
        1800
      );

    }

  }


  /* ==========================================================
     CREATURE PHYSICS
  ========================================================== */

  function updateCreature(delta) {

    creature.activityTimer -=
      delta;


    if (
      creature.activityTimer <= 0
    ) {

      creature.activityTimer =
        1800 +
        Math.random() * 4000;

      chooseRandomActivity();

    }


    /* ---------------------------------------
       FOLLOW CURSOR
    --------------------------------------- */

    const dx =
      mouseX -
      creature.x;

    const dy =
      mouseY -
      creature.y;


    const distance =
      Math.hypot(dx, dy);


    /* ---------------------------------------
       EYE INTERACTION
    --------------------------------------- */

    const eyes =
      getEyesCenter();


    if (eyes) {

      const eyeDX =
        creature.x -
        eyes.x;

      const eyeDY =
        creature.y -
        eyes.y;


      const eyeDistance =
        Math.hypot(
          eyeDX,
          eyeDY
        );


      if (
        eyeDistance < 190 &&
        creature.emotion ===
        "curious"
      ) {

        const reactions = [
          "scared",
          "angry",
          "surprised",
          "watching"
        ];


        const reaction =
          reactions[
            Math.floor(
              Math.random() *
              reactions.length
            )
          ];


        setEmotion(
          reaction,
          1300
        );

      }


      /* -----------------------------------
         BACK AWAY WHEN SCARED
      ----------------------------------- */

      if (
        creature.emotion ===
        "scared" &&
        eyeDistance < 230
      ) {

        creature.targetX =
          creature.x +
          eyeDX *
          1.5;

        creature.targetY =
          creature.y +
          eyeDY *
          1.5;

        creature.speed =
          2.5;

      }

    }


    /* ---------------------------------------
       CURSOR TARGET
    --------------------------------------- */

    if (
      creature.emotion !==
      "scared"
    ) {

      creature.targetX =
        mouseX -
        dx * .18;

      creature.targetY =
        mouseY -
        dy * .18;

    }


    const tx =
      creature.targetX -
      creature.x;

    const ty =
      creature.targetY -
      creature.y;


    const targetDistance =
      Math.hypot(tx, ty);


    if (
      targetDistance > 4
    ) {

      creature.angle =
        Math.atan2(
          ty,
          tx
        );


      const followSpeed =
        creature.emotion ===
        "scared"
          ? 2.7
          : 1.25;


      creature.x +=
        Math.cos(
          creature.angle
        ) *
        followSpeed;

      creature.y +=
        Math.sin(
          creature.angle
        ) *
        followSpeed;

    }


    /* ---------------------------------------
       NATURAL SHAKE
    --------------------------------------- */

    if (
      creature.shake > 0
    ) {

      creature.x +=
        (Math.random() - .5) *
        creature.shake;

      creature.y +=
        (Math.random() - .5) *
        creature.shake;

      creature.shake *= .92;

    }


    /* ---------------------------------------
       KEEP ON SCREEN
    --------------------------------------- */

    const margin = 40;

    creature.x =
      Math.max(
        margin,
        Math.min(
          window.innerWidth - margin,
          creature.x
        )
      );


    creature.y =
      Math.max(
        margin,
        Math.min(
          window.innerHeight - margin,
          creature.y
        )
      );


    /* ---------------------------------------
       BODY FOLLOW
    --------------------------------------- */

    segments[0].x =
      creature.x;

    segments[0].y =
      creature.y;

    segments[0].angle =
      creature.angle;


    for (
      let i = 1;
      i < segments.length;
      i++
    ) {

      const previous =
        segments[i - 1];

      const current =
        segments[i];


      const desiredDistance =
        13;


      const bodyDX =
        previous.x -
        current.x;

      const bodyDY =
        previous.y -
        current.y;


      const bodyDistance =
        Math.hypot(
          bodyDX,
          bodyDY
        );


      if (
        bodyDistance >
        desiredDistance
      ) {

        const ratio =
          (bodyDistance -
            desiredDistance) /
          bodyDistance;


        current.x +=
          bodyDX *
          ratio *
          .7;

        current.y +=
          bodyDY *
          ratio *
          .7;

      }


      current.angle =
        Math.atan2(
          bodyDY,
          bodyDX
        );

    }


    /* ---------------------------------------
       EMOTION TIMER
    --------------------------------------- */

    if (
      creature.emotionTimer > 0
    ) {

      creature.emotionTimer -=
        delta;

    }


    if (
      creature.emotionTimer <= 0
    ) {

      hideEmotion();

      creature.emotion =
        "curious";

    }

  }


  /* ==========================================================
     DRAW SKELETON
  ========================================================== */

  function drawCreature(time) {

    const ctx =
      creatureCtx;


    /* Clear */

    ctx.clearRect(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );


    /* ---------------------------------------
       TRAIL
    --------------------------------------- */

    ctx.save();

    ctx.globalAlpha = .08;

    ctx.strokeStyle =
      "#ff6b35";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
      creature.x,
      creature.y,
      24 +
      Math.sin(time / 300) * 4,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();


    /* ---------------------------------------
       BODY
    --------------------------------------- */

    for (
      let i = segments.length - 1;
      i >= 0;
      i--
    ) {

      const segment =
        segments[i];


      const scale =
        1 -
        i /
        (segments.length * 2);


      const radius =
        7 *
        scale;


      const pulse =
        Math.sin(
          time / 180 +
          segment.phase
        ) *
        .7;


      /* -----------------------------------
         BODY GLOW
      ----------------------------------- */

      ctx.save();

      ctx.shadowBlur = 10;

      ctx.shadowColor =
        "rgba(255,107,53,.7)";


      ctx.strokeStyle =
        i === 0
          ? "#ffb84d"
          : "#ff6b35";

      ctx.lineWidth =
        i === 0
          ? 2
          : 1.4;


      /* -----------------------------------
         BODY SPINE
      ----------------------------------- */

      ctx.beginPath();

      ctx.arc(
        segment.x,
        segment.y,
        radius + pulse,
        0,
        Math.PI * 2
      );

      ctx.stroke();


      /* -----------------------------------
         BODY INTERNAL BONE
      ----------------------------------- */

      if (i > 0) {

        const prev =
          segments[i - 1];


        ctx.beginPath();

        ctx.moveTo(
          segment.x,
          segment.y
        );

        ctx.lineTo(
          prev.x,
          prev.y
        );

        ctx.stroke();

      }


      /* -----------------------------------
         LEGS
      ----------------------------------- */

      if (i > 0) {

        drawLeg(
          segment,
          i,
          time,
          1
        );

        drawLeg(
          segment,
          i,
          time,
          -1
        );

      }


      ctx.restore();

    }


    /* ---------------------------------------
       HEAD
    --------------------------------------- */

    drawHead(
      segments[0],
      time
    );

  }


  /* ==========================================================
     DRAW LEGS
  ========================================================== */

  function drawLeg(
    segment,
    index,
    time,
    side
  ) {

    const ctx =
      creatureCtx;


    const angle =
      segment.angle;


    const phase =
      time / 130 +
      index * .8;


    const movement =
      Math.sin(
        phase
      ) *
      5;


    const sideAngle =
      angle +
      side *
      (Math.PI / 2);


    const legLength =
      14 +
      Math.sin(
        index
      ) *
      2;


    const startX =
      segment.x +
      Math.cos(
        sideAngle
      ) *
      4;


    const startY =
      segment.y +
      Math.sin(
        sideAngle
      ) *
      4;


    const midX =
      startX +
      Math.cos(
        sideAngle
      ) *
      (
        legLength * .55
      );


    const midY =
      startY +
      Math.sin(
        sideAngle
      ) *
      (
        legLength * .55
      );


    const endX =
      startX +
      Math.cos(
        sideAngle
      ) *
      (
        legLength +
        movement
      );


    const endY =
      startY +
      Math.sin(
        sideAngle
      ) *
      (
        legLength +
        movement
      );


    ctx.save();

    ctx.strokeStyle =
      "rgba(255,107,53,.85)";

    ctx.lineWidth = 1.1;

    ctx.beginPath();

    ctx.moveTo(
      startX,
      startY
    );

    ctx.lineTo(
      midX,
      midY
    );

    ctx.lineTo(
      endX,
      endY
    );

    ctx.stroke();


    /* Tiny claw */

    ctx.beginPath();

    ctx.moveTo(
      endX,
      endY
    );

    ctx.lineTo(
      endX +
      Math.cos(
        sideAngle + .5
      ) *
      4,

      endY +
      Math.sin(
        sideAngle + .5
      ) *
      4
    );

    ctx.stroke();

    ctx.restore();

  }


  /* ==========================================================
     DRAW HEAD
  ========================================================== */

  function drawHead(
    segment,
    time
  ) {

    const ctx =
      creatureCtx;


    const angle =
      Math.atan2(
        mouseY -
        segment.y,

        mouseX -
        segment.x
      );


    const headSize = 12;


    ctx.save();

    ctx.translate(
      segment.x,
      segment.y
    );


    ctx.rotate(angle);


    /* Glow */

    ctx.shadowBlur = 18;

    ctx.shadowColor =
      "rgba(255,184,77,.8)";


    ctx.strokeStyle =
      "#ffb84d";

    ctx.lineWidth = 2;


    /* Skull */

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      headSize,
      0,
      Math.PI * 2
    );

    ctx.stroke();


    /* Jaw */

    ctx.beginPath();

    ctx.moveTo(
      -7,
      5
    );

    ctx.lineTo(
      0,
      9
    );

    ctx.lineTo(
      7,
      5
    );

    ctx.stroke();


    /* Eye sockets */

    ctx.beginPath();

    ctx.arc(
      -4,
      -3,
      2,
      0,
      Math.PI * 2
    );

    ctx.arc(
      4,
      -3,
      2,
      0,
      Math.PI * 2
    );

    ctx.stroke();


    /* Antennas */

    ctx.beginPath();

    ctx.moveTo(
      -5,
      -8
    );

    ctx.lineTo(
      -11,
      -15
    );

    ctx.moveTo(
      5,
      -8
    );

    ctx.lineTo(
      11,
      -15
    );

    ctx.stroke();


    /* Teeth */

    for (
      let i = -2;
      i <= 2;
      i++
    ) {

      ctx.beginPath();

      ctx.moveTo(
        i * 3,
        6
      );

      ctx.lineTo(
        i * 3,
        9
      );

      ctx.stroke();

    }


    ctx.restore();

  }


  /* ==========================================================
     CREATURE ANIMATION LOOP
  ========================================================== */

  let lastTime =
    performance.now();


  function creatureLoop(
    currentTime
  ) {

    const delta =
      currentTime -
      lastTime;


    lastTime =
      currentTime;


    updateCreature(
      Math.min(delta, 50)
    );


    drawCreature(
      currentTime
    );


    /* Emotion label follows creature */

    if (
      emotionBox &&
      emotionBox.classList.contains(
        "visible"
      )
    ) {

      emotionBox.style.left =
        `${creature.x}px`;

      emotionBox.style.top =
        `${creature.y - 25}px`;

    }


    requestAnimationFrame(
      creatureLoop
    );

  }


  requestAnimationFrame(
    creatureLoop
  );


  /* ==========================================================
     5. LOADING
  ========================================================== */

  function showLoading() {

    const loading =
      $("loadingState");

    if (loading) {

      loading.hidden =
        false;

    }

  }


  function hideLoading() {

    const loading =
      $("loadingState");

    if (loading) {

      loading.hidden =
        true;

    }

  }


  /* ==========================================================
     6. FILE VALIDATION
  ========================================================== */

  function validateFile(
    file,
    allowedTypes,
    typeName
  ) {

    if (!file) {

      showError(
        "No file selected."
      );

      return false;

    }


    if (file.size === 0) {

      showError(
        "The selected file is empty."
      );

      return false;

    }


    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {

      showError(
        `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`
      );

      return false;

    }


    if (
      file.type &&
      !allowedTypes.includes(
        file.type
      )
    ) {

      showError(
        `Invalid ${typeName} file.`
      );

      return false;

    }


    return true;

  }


  /* ==========================================================
     7. BACKEND HEALTH CHECK
  ========================================================== */

  const apiStatusDot =
    $("apiStatusDot");

  const apiStatusText =
    $("apiStatusText");


  async function checkBackendStatus() {

    try {

      const response =
        await fetch(
          `${API_BASE}/`
        );


      if (!response.ok) {

        throw new Error(
          "Backend unavailable"
        );

      }


      if (apiStatusDot) {

        apiStatusDot.classList
          .remove("offline");

        apiStatusDot.classList
          .add("online");

      }


      if (apiStatusText) {

        apiStatusText.textContent =
          "System online";

      }

    }

    catch (error) {

      console.error(
        "Backend:",
        error
      );


      if (apiStatusDot) {

        apiStatusDot.classList
          .remove("online");

        apiStatusDot.classList
          .add("offline");

      }


      if (apiStatusText) {

        apiStatusText.textContent =
          "Backend offline";

      }

    }

  }


  checkBackendStatus();


  /* ==========================================================
     8. TABS
  ========================================================== */

  let liveActive = false;

  let liveSocket = null;

  let liveStream = null;


  const tabs =
    document.querySelectorAll(
      ".tab"
    );


  const tabContents =
    document.querySelectorAll(
      ".tab-content"
    );


  tabs.forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          const tabName =
            tab.dataset.tab;


          tabs.forEach(
            (item) => {

              item.classList
                .remove("active");

            }
          );


          tabContents.forEach(
            (content) => {

              content.classList
                .remove("active");

            }
          );


          tab.classList
            .add("active");


          const target =
            $(
              `tab-${tabName}`
            );


          if (target) {

            target.classList
              .add("active");

          }


          if (
            tabName !== "live" &&
            liveActive
          ) {

            stopLiveDetection();

          }

        }
      );

    }
  );


  /* ==========================================================
     9. IMAGE UPLOAD
  ========================================================== */

  const imageInput =
    $("imageInput");

  const dropzoneImage =
    $("dropzoneImage");


  if (imageInput) {

    imageInput.addEventListener(
      "change",
      () => {

        if (
          imageInput.files &&
          imageInput.files.length
        ) {

          handleImageUpload(
            imageInput.files[0]
          );

        }


        imageInput.value = "";

      }
    );

  }


  if (dropzoneImage) {

    setupDragDrop(
      dropzoneImage,
      handleImageUpload
    );

  }


  async function handleImageUpload(
    file
  ) {

    if (
      !validateFile(
        file,
        ALLOWED_IMAGE_TYPES,
        "image"
      )
    ) {

      return;

    }


    showLoading();


    const formData =
      new FormData();


    formData.append(
      "file",
      file
    );


    try {

      const response =
        await fetch(
          `${API_BASE}/api/detect/image`,
          {

            method: "POST",

            headers: {
              "x-api-key":
                API_KEY
            },

            body: formData

          }
        );


      const data =
        await parseResponse(
          response
        );


      if (!response.ok) {

        throw new Error(
          data.detail ||
          `Server error: ${response.status}`
        );

      }


      if (
        !data.result_image_url
      ) {

        throw new Error(
          "Backend did not return a result image."
        );

      }


      showImageResult(
        data
      );

    }

    catch (error) {

      console.error(
        error
      );

      showError(
        error.message ||
        "Image analysis failed."
      );

    }

    finally {

      hideLoading();

    }

  }


  /* ==========================================================
     10. IMAGE RESULT
  ========================================================== */

  function showImageResult(
    data
  ) {

    const results =
      $("resultsImage");

    const image =
      $("resultImageEl");

    const badge =
      $("resultBadgeImage");

    const list =
      $("resultDetectionsImage");


    if (!results || !image) {

      showError(
        "Image result elements are missing."
      );

      return;

    }


    image.src =
      `${API_BASE}${data.result_image_url}?t=${Date.now()}`;


    updateBadge(
      badge,
      Boolean(
        data.fire_detected
      )
    );


    updateDetectionsList(
      list,
      Array.isArray(
        data.detections
      )
        ? data.detections
        : []
    );


    results.hidden =
      false;

  }


  /* ==========================================================
     11. VIDEO UPLOAD
  ========================================================== */

  const videoInput =
    $("videoInput");

  const dropzoneVideo =
    $("dropzoneVideo");


  if (videoInput) {

    videoInput.addEventListener(
      "change",
      () => {

        if (
          videoInput.files &&
          videoInput.files.length
        ) {

          handleVideoUpload(
            videoInput.files[0]
          );

        }


        videoInput.value = "";

      }
    );

  }


  if (dropzoneVideo) {

    setupDragDrop(
      dropzoneVideo,
      handleVideoUpload
    );

  }


  async function handleVideoUpload(
    file
  ) {

    if (
      !validateFile(
        file,
        ALLOWED_VIDEO_TYPES,
        "video"
      )
    ) {

      return;

    }


    showLoading();


    const formData =
      new FormData();


    formData.append(
      "file",
      file
    );


    try {

      const response =
        await fetch(
          `${API_BASE}/api/detect/video`,
          {

            method: "POST",

            headers: {
              "x-api-key":
                API_KEY
            },

            body: formData

          }
        );


      const data =
        await parseResponse(
          response
        );


      if (!response.ok) {

        throw new Error(
          data.detail ||
          `Server error: ${response.status}`
        );

      }


      if (
        !data.result_video_url
      ) {

        throw new Error(
          "Backend did not return a result video."
        );

      }


      showVideoResult(
        data
      );

    }

    catch (error) {

      console.error(
        error
      );

      showError(
        error.message ||
        "Video analysis failed."
      );

    }

    finally {

      hideLoading();

    }

  }


  /* ==========================================================
     12. VIDEO RESULT
  ========================================================== */

  function showVideoResult(
    data
  ) {

    const results =
      $("resultsVideo");

    const video =
      $("resultVideoEl");

    const badge =
      $("resultBadgeVideo");

    const list =
      $("resultDetectionsVideo");


    if (
      !results ||
      !video
    ) {

      showError(
        "Video result elements are missing."
      );

      return;

    }


    video.src =
      `${API_BASE}${data.result_video_url}?t=${Date.now()}`;


    video.load();


    updateBadge(
      badge,
      Boolean(
        data.fire_detected
      )
    );


    if (list) {

      list.innerHTML = "";


      const li =
        document.createElement(
          "li"
        );


      li.textContent =
        `${data.frames_processed || 0} frames analyzed`;


      list.appendChild(
        li
      );

    }


    results.hidden =
      false;

  }


  /* ==========================================================
     13. LIVE CAMERA
  ========================================================== */

  const liveToggleBtn =
    $("liveToggleBtn");

  const liveVideo =
    $("liveVideo");

  const liveCanvas =
    $("liveCanvas");

  const liveOutput =
    $("liveOutput");

  const liveAlert =
    $("liveAlert");


  if (liveToggleBtn) {

    liveToggleBtn.addEventListener(
      "click",
      () => {

        if (liveActive) {

          stopLiveDetection();

        }

        else {

          startLiveDetection();

        }

      }
    );

  }


  async function startLiveDetection() {

    if (
      !liveVideo ||
      !liveCanvas ||
      !liveOutput
    ) {

      showError(
        "Live camera elements are missing."
      );

      return;

    }


    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      showError(
        "Your browser does not support camera access."
      );

      return;

    }


    try {

      liveStream =
        await navigator.mediaDevices
          .getUserMedia({

            video: true,

            audio: false

          });


      liveVideo.srcObject =
        liveStream;


      await liveVideo.play();

    }

    catch (error) {

      console.error(
        "Camera:",
        error
      );


      if (liveAlert) {

        liveAlert.textContent =
          "Camera access denied";

      }


      showError(
        "Please allow camera permission and try again."
      );


      return;

    }


    const WS_BASE =
      API_BASE
        .replace(
          "http://",
          "ws://"
        )
        .replace(
          "https://",
          "wss://"
        );


    try {

      liveSocket =
        new WebSocket(
          `${WS_BASE}/api/detect/live`
        );

    }

    catch (error) {

      stopLiveDetection();

      showError(
        "Could not start live connection."
      );

      return;

    }


    liveSocket.onopen =
      () => {

        liveActive =
          true;


        liveToggleBtn.textContent =
          "Stop Live Detection";


        liveToggleBtn.classList
          .add("active");


        if (liveAlert) {

          liveAlert.textContent =
            "Live detection started";

          liveAlert.className =
            "live-alert safe";

        }


        setTimeout(
          sendLiveFrame,
          300
        );

      };


    liveSocket.onmessage =
      (event) => {

        try {

          const data =
            JSON.parse(
              event.data
            );


          if (data.error) {

            console.error(
              data.error
            );

            if (liveActive) {

              setTimeout(
                sendLiveFrame,
                500
              );

            }

            return;

          }


          if (
            data.annotated_frame
          ) {

            liveOutput.src =
              data.annotated_frame;

          }


          if (liveAlert) {

            if (
              data.fire_detected
            ) {

              liveAlert.textContent =
                "🔥 Fire detected";

              liveAlert.className =
                "live-alert fire";

            }

            else {

              liveAlert.textContent =
                "No fire";

              liveAlert.className =
                "live-alert safe";

            }

          }


          if (liveActive) {

            setTimeout(
              sendLiveFrame,
              300
            );

          }

        }

        catch (error) {

          console.error(
            "Live parsing:",
            error
          );

        }

      };


    liveSocket.onerror =
      () => {

        if (liveAlert) {

          liveAlert.textContent =
            "Live connection error";

          liveAlert.className =
            "live-alert";

        }

      };


    liveSocket.onclose =
      () => {

        if (!liveActive)
          return;


        liveActive =
          false;


        if (liveToggleBtn) {

          liveToggleBtn.textContent =
            "Start Live Detection";

          liveToggleBtn.classList
            .remove("active");

        }


        if (liveAlert) {

          liveAlert.textContent =
            "Live connection closed";

          liveAlert.className =
            "live-alert";

        }

      };

  }


  /* ==========================================================
     SEND LIVE FRAME
  ========================================================== */

  function sendLiveFrame() {

    if (
      !liveActive ||
      !liveSocket ||
      liveSocket.readyState !==
        WebSocket.OPEN
    ) {

      return;

    }


    if (
      liveVideo.readyState < 2 ||
      !liveVideo.videoWidth
    ) {

      setTimeout(
        sendLiveFrame,
        200
      );

      return;

    }


    const context =
      liveCanvas.getContext(
        "2d"
      );


    liveCanvas.width =
      liveVideo.videoWidth;

    liveCanvas.height =
      liveVideo.videoHeight;


    context.drawImage(
      liveVideo,
      0,
      0,
      liveCanvas.width,
      liveCanvas.height
    );


    const frame =
      liveCanvas.toDataURL(
        "image/jpeg",
        .7
      );


    try {

      liveSocket.send(
        frame
      );

    }

    catch (error) {

      console.error(
        error
      );

    }

  }


  /* ==========================================================
     STOP LIVE
  ========================================================== */

  function stopLiveDetection() {

    liveActive =
      false;


    if (liveToggleBtn) {

      liveToggleBtn.textContent =
        "Start Live Detection";

      liveToggleBtn.classList
        .remove("active");

    }


    if (liveSocket) {

      liveSocket.onclose =
        null;


      if (
        liveSocket.readyState ===
          WebSocket.OPEN ||

        liveSocket.readyState ===
          WebSocket.CONNECTING
      ) {

        liveSocket.close();

      }


      liveSocket =
        null;

    }


    if (liveStream) {

      liveStream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );


      liveStream =
        null;

    }


    if (liveVideo) {

      liveVideo.srcObject =
        null;

    }


    if (liveOutput) {

      liveOutput.removeAttribute(
        "src"
      );

    }


    if (liveAlert) {

      liveAlert.textContent =
        "Camera off";

      liveAlert.className =
        "live-alert";

    }

  }


  /* ==========================================================
     14. DRAG & DROP
  ========================================================== */

  function setupDragDrop(
    zone,
    handler
  ) {

    if (!zone) return;


    [
      "dragenter",
      "dragover"
    ].forEach(
      eventName => {

        zone.addEventListener(
          eventName,
          event => {

            event.preventDefault();

            event.stopPropagation();

            zone.classList
              .add("dragover");

          }
        );

      }
    );


    [
      "dragleave",
      "drop"
    ].forEach(
      eventName => {

        zone.addEventListener(
          eventName,
          event => {

            event.preventDefault();

            event.stopPropagation();

            zone.classList
              .remove("dragover");

          }
        );

      }
    );


    zone.addEventListener(
      "drop",
      event => {

        const files =
          event.dataTransfer.files;


        if (
          files &&
          files.length
        ) {

          handler(
            files[0]
          );

        }

      }
    );

  }


  /* ==========================================================
     15. RESULT BADGE
  ========================================================== */

  function updateBadge(
    badge,
    fireDetected
  ) {

    if (!badge)
      return;


    if (fireDetected) {

      badge.textContent =
        "🔥 Fire Detected";

      badge.className =
        "result-badge fire";

    }

    else {

      badge.textContent =
        "✅ No Fire Detected";

      badge.className =
        "result-badge safe";

    }

  }


  /* ==========================================================
     16. DETECTION LIST
  ========================================================== */

  function updateDetectionsList(
    list,
    detections
  ) {

    if (!list)
      return;


    list.innerHTML =
      "";


    if (
      !Array.isArray(
        detections
      ) ||
      detections.length === 0
    ) {

      const li =
        document.createElement(
          "li"
        );


      li.textContent =
        "No objects detected";


      list.appendChild(
        li
      );


      return;

    }


    detections.forEach(
      detection => {

        const li =
          document.createElement(
            "li"
          );


        const className =
          detection.class_name ||
          "Unknown";


        const confidence =
          Number(
            detection.confidence
          );


        const confidenceText =
          Number.isFinite(
            confidence
          )
            ? `${(
                confidence * 100
              ).toFixed(1)}%`
            : "N/A";


        li.textContent =
          `${className} — ${confidenceText} confidence`;


        list.appendChild(
          li
        );

      }
    );

  }


  /* ==========================================================
     17. CLEANUP
  ========================================================== */

  window.addEventListener(
    "beforeunload",
    () => {

      stopLiveDetection();

    }
  );


  console.log(
    "🔥 Sentinel frontend initialized."
  );

  console.log(
    "🦂 Skeleton creature initialized."
  );

});