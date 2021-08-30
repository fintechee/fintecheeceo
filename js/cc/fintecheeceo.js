var renderer, scene, logoPlane, bgPlane, shadowTexture, bgTexture, directionalLight;
var camera, dTime, preTime, camSpeed = new THREE.Vector3(4, 2, 4), camTime = 0, camMode = 1;
var CAM_SPEED_MIN = 0.1, CAM_SPEED_MAX = 0.1, CAM_POS_TIME = 10, CAM_POS_MIN = new THREE.Vector3(-3, 3, 3), CAM_POS_MAX = new THREE.Vector3(3, 3, 3), //(-3, 3, 0)(7, 5, 5)
    CAM_INIT_POS_Y = 100, CAM_INIT_POS_Z = 8, CAM_INIT_POS2_Y = 10, CAM_FALL_SPEED = 0.3;
var FOG_COLOR = 0x4DABF5, SHADOW_COLOR = 0xFFFF00, CLOUD_LAYER_NUM = 20, SHADOW_LAYER_NUM = 1, CLOUD_POS_MAX = 100, SHADOW_POS_MAX = 1; // SHADOW_LAYER_NUM = 1
var AMBIENT_LIGHT = 0x000000, DIRECTIONAL_LIGHT = 0xFFFFFF, DIRECTIONAL_LIGHT2 = 0xAAAAAA; // FFFFFF
var GALLERY_NUM = 9, galleryTexture = [], galleryPlane = [], ROW = 3;

function updateRenderer () {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initAnim () {
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("maincanvas")
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFFFFF);
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 50000);
    camera.position.y = CAM_INIT_POS_Y;
    camera.position.z = CAM_INIT_POS_Z;
    scene.add(camera);

    renderer.render(scene, camera);

    var loader = new THREE.TextureLoader();

    var cloudGeo = new THREE.Geometry();

    THREE.ImageUtils.crossOrigin = "";

    loader.load("/images/cloud.png", function (cloudTexture) {
        var logoMaterial;

        loader.load("/images/logo_banner.png", function (shadowTxture) {
            shadowTexture = shadowTxture;

            var bgUrl = "/images/logo_banner.png";
            if (window.innerWidth > 500) {
                bgUrl = "/images/logo_banner.png";
            }
            loader.load(bgUrl, function (bgTxture) {
                //shadowTexture = bgTexture;
                bgTexture = bgTxture

                cloudTexture.magFilter = THREE.LinearMipMapLinearFilter;
                cloudTexture.minFilter = THREE.LinearMipMapLinearFilter;

                var cloudFog = new THREE.Fog(FOG_COLOR, -100, 5000);

                var cloudMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        "map": {type: "t", value: cloudTexture},
                        "fogColor" : {type: "c", value: cloudFog.color},
                        "fogNear" : {type: "f", value: cloudFog.near},
                        "fogFar" : {type: "f", value: cloudFog.far}
                    },
                    vertexShader: document.getElementById("vs").textContent,
                    fragmentShader: document.getElementById("fs").textContent,
                    depthWrite: false,
                    depthTest: false,
                    transparent: true
                });

                var cloudPlane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));
                for (var i = 0; i < CLOUD_LAYER_NUM; i++) {
                    cloudPlane.position.x = Math.random() * CLOUD_POS_MAX - CLOUD_POS_MAX / 2.0;
                    cloudPlane.position.z = Math.random() * CLOUD_POS_MAX - CLOUD_POS_MAX / 2.0;
                    cloudPlane.position.y = i * 3;
                    cloudPlane.rotation.y = Math.random() * Math.PI / 10.0;
                    cloudPlane.rotation.z = Math.random() * Math.PI / 10.0;
                    cloudPlane.rotation.x = - Math.PI / 2.0;
                    cloudPlane.scale.x = cloudPlane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
                    cloudPlane.material.side = THREE.DoubleSide;

                    THREE.GeometryUtils.merge(cloudGeo, cloudPlane);
                }

                var cloudMesh = new THREE.Mesh(cloudGeo, cloudMaterial);
                cloudMesh.position.y = 20;
                scene.add(cloudMesh);

                shadowTexture.wrapS = THREE.RepeatWrapping;
                shadowTexture.wrapT = THREE.RepeatWrapping;

                var logoMaterial = new THREE.MeshLambertMaterial({map : shadowTexture});
                logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 4.0), logoMaterial);
                logoPlane.rotation.x = -Math.PI / 2.0;
                logoPlane.rotation.z = Math.PI / 5.0;
                logoPlane.position.x = 0;

                scene.add(logoPlane);

                var ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT);
                scene.add(ambientLight);
                directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT, 1.5);
                directionalLight.position.x = 0;
                directionalLight.position.y = 1;
                directionalLight.position.z = 0;
                directionalLight.position.normalize();
                scene.add(directionalLight);

                renderer.render(scene, camera);

                preTime = (new Date).getTime();
                animate();
            })
        })
    });
}

var animId = null;
var bStopped = false;

function animate () {
    if (bStopped) {
        stopPlayingAnim();
        return;
    }

    animId = requestAnimationFrame(animate);

    var currTime = (new Date).getTime();
    dTime = (currTime - preTime) * 0.001;
    preTime = currTime;
    upCam();
    renderer.render(scene, camera);
}

function hideCanvas () {
    var canvasWrapper = document.getElementById("canvaswrapper");
    canvasWrapper.style.display = "none";
}

function stopPlayingAnim () {
    bStopped = true;

    if (typeof animId != "undefined" && animId != null) {
        cancelAnimationFrame(animId);
    }

    hideCanvas();
}

var preRandX = Math.random();
var preRandY = Math.random();
var preRandZ = Math.random();

var bShowShadow = true;

async function upCam () {
    camTime -= dTime;

    if (camera.position.y < -10.0 && camMode != 2) {
        camera.position.x = 0.0;
        camera.position.y = CAM_INIT_POS2_Y;
        camera.position.z = CAM_INIT_POS_Z;
        camMode = 2;
    }

    if (camMode == 2) {
        if (camTime < 0) {
            camTime = CAM_POS_TIME;

            var randX = null;
            var randY = null;
            var randZ = null;

            if (preRandX > 0.5) {
                randX = Math.random() / 2;
            } else {
                randX = 0.5 + Math.random() / 2;
            }
            if (preRandY > 0.5) {
                randY = Math.random() / 2;
            } else {
                randY = 0.5 + Math.random() / 2;
            }
            if (preRandZ > 0.5) {
                randZ = Math.random() / 2;
            } else {
                randZ = 0.5 + Math.random() / 2;
            }

            camera.position.x = CAM_POS_MIN.x + randX * (CAM_POS_MAX.x - CAM_POS_MIN.x);
            camera.position.y = CAM_POS_MIN.y + randY * (CAM_POS_MAX.y - CAM_POS_MIN.y);
            camera.position.z = CAM_POS_MIN.z + randZ * (CAM_POS_MAX.z - CAM_POS_MIN.z);

            preRandX = randX;
            preRandY = randY;
            preRandZ = randZ;

            camSpeed.x = camSpeed.y = camSpeed.z = 0;
            camSpeed.x = CAM_SPEED_MIN + Math.random() * (CAM_SPEED_MAX - CAM_SPEED_MIN);
            camSpeed.x *= Math.random() > 0.5 ? 1 : -1;
            camSpeed.z *= Math.random() > 0.5 ? 1 : -1;
        }

        if (bShowShadow) {
            scene.remove(directionalLight)
            directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT2, 1.5)
            directionalLight.position.x = 0;
            directionalLight.position.y = 1;
            directionalLight.position.z = 0;
            directionalLight.position.normalize();
            scene.add(directionalLight);

            var bgMaterial = new THREE.MeshLambertMaterial({map : bgTexture});
            bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), bgMaterial); // 5, 5
            //bgPlane.map.repeat.set( 10, 10 );///////
            bgPlane.rotation.x = -Math.PI / 2.0;
            bgPlane.rotation.z = Math.PI / 5.0;
            bgPlane.position.x = 0;
            scene.remove(logoPlane);
            scene.add(bgPlane);

            shadowTexture.magFilter = THREE.LinearMipMapLinearFilter;
            shadowTexture.minFilter = THREE.LinearMipMapLinearFilter;

            var shadowFog = new THREE.Fog(SHADOW_COLOR, -100, 5000);

            var shadowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    "map": {type: "t", value: shadowTexture},
                    "fogColor" : {type: "c", value: shadowFog.color},
                    "fogNear" : {type: "f", value: shadowFog.near},
                    "fogFar" : {type: "f", value: shadowFog.far}
                },
                vertexShader: document.getElementById("vs").textContent,
                fragmentShader: document.getElementById("fs").textContent,
                depthWrite: false,
                depthTest: false,
                transparent: true
            });

            var shadowGeo = new THREE.Geometry();
            var shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5));

            for (var i = 0; i < SHADOW_LAYER_NUM; i++) {
                shadowPlane.position.x = Math.random() * SHADOW_POS_MAX - SHADOW_POS_MAX / 2.0;
                shadowPlane.position.z = Math.random() * SHADOW_POS_MAX - SHADOW_POS_MAX / 10.0;
                shadowPlane.position.y = 0.06 * i + 0.03;
                shadowPlane.rotation.y = Math.random() * Math.PI / 10.0;
                shadowPlane.rotation.z = Math.random() * Math.PI / 10.0;
                shadowPlane.rotation.x = - Math.PI / 2.0;
                shadowPlane.scale.x = shadowPlane.scale.y = 3.5; // Math.random() * 5.0 3.0
                shadowPlane.material.side = THREE.DoubleSide;

                THREE.GeometryUtils.merge(shadowGeo, shadowPlane);
            }

            var shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
            shadowMesh.position.y = 1;
            scene.add(shadowMesh);

            renderer.setClearColor(0xFFFFFF);

            var loader = new THREE.TextureLoader();
            var galleryGeo = new THREE.Geometry();
            var galleryMaterial = [];

            for (var i = 0; i < GALLERY_NUM; i++) {
                var galleryTxture = loader.load("/images/" + i + ".jpg");
                galleryTexture.push(galleryTxture);

                galleryTexture[i].magFilter = THREE.LinearMipMapLinearFilter;
                galleryTexture[i].minFilter = THREE.LinearMipMapLinearFilter;

                var galleryFog = new THREE.Fog(FOG_COLOR, -100, 5000);

                galleryMaterial.push(new THREE.MeshBasicMaterial({map : galleryTexture[i]}));

                galleryPlane.push(new THREE.Mesh(new THREE.PlaneGeometry(512, 384), galleryMaterial[i]));

                // var rand = Math.random()
                //
                // galleryPlane[i].rotation.x = -Math.PI / (2.0 * (i + 1) * rand);
                // galleryPlane[i].rotation.y = Math.PI / ((i + 1) * rand);
                // galleryPlane[i].rotation.z = Math.PI / (5.0 * (i + 1) * rand);
                // galleryPlane[i].position.x = 0.5 * (i - 5) * rand;
                // galleryPlane[i].position.y = 0.5 * (i - 5) * rand * 2;
                // galleryPlane[i].position.z = 0.5 * (i - 5) * rand * 3;
                var r = i % 3;
                var c = Math.floor(i / 3);
                galleryPlane[i].rotation.x = Math.PI * 3 / 4; // -Math.PI / 2.0
                galleryPlane[i].rotation.y = Math.PI; // 0
                galleryPlane[i].rotation.z = Math.PI; // 0
                galleryPlane[i].position.x = 0.512 * (r - 1);
                galleryPlane[i].position.y = 0.384;
                galleryPlane[i].position.z = 0.384 * (c + 0);

                galleryPlane[i].scale.x = galleryPlane[i].scale.y = 0.001;
                galleryPlane[i].material.side = THREE.DoubleSide;

                // THREE.GeometryUtils.merge(galleryGeo, galleryPlane[i]);

                // var galleryMesh = new THREE.Mesh(galleryGeo, galleryMaterial[i]);
                // scene.add(galleryMesh);
                scene.add(galleryPlane[i]);

                // await new Promise(resolve => setTimeout(resolve, 3000));
            }

            bShowShadow = false
        }
    }

    camera.position.x += camSpeed.x * dTime;
    if (camMode == 1) {
        camera.position.y -= CAM_FALL_SPEED;
    } else {
        camera.position.y += camSpeed.y * dTime;

        if (camera.position.x > (CAM_POS_MAX.x + CAM_SPEED_MAX * CAM_POS_TIME) ||
            camera.position.x < (CAM_POS_MIN.x - CAM_SPEED_MAX * CAM_POS_TIME + 0.5 * (CAM_POS_MAX.x - CAM_POS_MIN.x))) {

            camera.position.x = CAM_POS_MIN.x + (0.5 + Math.random() / 2) * (CAM_POS_MAX.x - CAM_POS_MIN.x);
        }
        if (camera.position.y > (CAM_POS_MAX.y + CAM_SPEED_MAX * CAM_POS_TIME) ||
            camera.position.y < (CAM_POS_MIN.y - CAM_SPEED_MAX * CAM_POS_TIME + 0.5 * (CAM_POS_MAX.y - CAM_POS_MIN.y))) {

            camera.position.y = CAM_POS_MIN.y + (0.5 + Math.random() / 2) * (CAM_POS_MAX.y - CAM_POS_MIN.y);
        }
        if (camera.position.z > (CAM_POS_MAX.z + CAM_SPEED_MAX * CAM_POS_TIME) ||
            camera.position.z < (CAM_POS_MIN.z - CAM_SPEED_MAX * CAM_POS_TIME + 0.5 * (CAM_POS_MAX.z - CAM_POS_MIN.z))) {

            camera.position.z = CAM_POS_MIN.z + (0.5 + Math.random() / 2) * (CAM_POS_MAX.z - CAM_POS_MIN.z);
        }
    }
    camera.position.z += camSpeed.z * dTime;

    camera.lookAt(logoPlane.position);
}
