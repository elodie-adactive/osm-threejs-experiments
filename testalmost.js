/**
 * Created by elodie on 07/10/15.
 */
var renderer, scene, camera, controls, parent;

var width = 1920;
var height = 1080;

//BOSTON BEACON HILL
//var minlon = -71.07019;
//var maxlat = 42.36024;
//var maxlon = -71.06683;
//var minlat = 42.35878;


//PARIS MARAIS
//var minlon = 2.35826;
//var maxlat = 48.85916;
//var maxlon = 2.36668;
//var minlat = 48.85614;

//BOSTON FINANCIAL DISTRICT (quite complete)
//var minlon = -71.06310;
//var maxlat = 42.35904;
//var maxlon = -71.05197;
//var minlat = 42.35226;

//BOSTON FINANCIAL DISTRICT + BOSTON COMMONS(quite complete)
//var minlon = -71.0841;
//var maxlat = 42.3630;
//var maxlon = -71.0504;
//var minlat = 42.3493;

// MARSEILLE
var minlon = 5.38965;
var maxlat = 43.29404;
var maxlon = 5.40650;
var minlat = 43.28689;



var bbox = [[
    //left, top
    minlon, maxlat
], [
    //right, bottom
    maxlon, minlat
]];

var scale = 360*width/(maxlon-minlon);

var projection = d3.geo.mercator();
projection.scale(scale);
projection.translate([0,0]);
var trans = projection([(minlon+maxlon)/2,(maxlat+minlat)/2]);
projection.translate([-1*trans[0],-1*trans[1]]);


var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function initRenderer(width,height,color)
{
    renderer.setSize(width, height);
    renderer.setClearColor( color );
    renderer.shadowMapEnabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    document.body.appendChild(renderer.domElement);
}
function initCamera()
{
    camera = new THREE.PerspectiveCamera(
        35,             // Field of view
        960 / 500,      // Aspect ratio
        10,            // Near plane
        10000           // Far plane
    );

    camera.position.set(0, 0, 700);
    camera.lookAt(new THREE.Vector3(0,0,0));

    scene.add(camera);
}

function filterGraph(graph,tag, tagValue){
    return _.filter(graph.entities, function(e) {
        return e.type == 'way' && e.tags[tag]&& (e.tags[tag] == tagValue);
    }).map(function(b) {
        return graph.fetch(b.id);
    });
}

var connection = iD.Connection();

connection.bboxFromAPI(bbox, function(graph) {


    renderer = new THREE.WebGLRenderer({antialias: true});

      var targetRotation = 0, targetRotationX = 0;
    //Extract


    function setup() {

        scene = new THREE.Scene();
        parent = new THREE.Object3D();
        parent.castShadow = true;
        parent.position.y = 0;
        scene.add(parent);
        //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)

        initRenderer(width,height, 0xcccccc);
        initCamera();
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        doSkybox();
        //axes = buildAxes( 1000 );
        //scene.add(axes);



        var buildings = filterGraph(graph,'building', 'yes');
        var hospitalsBuildings = filterGraph(graph,'building', 'hospital');

        var parksLeisure = filterGraph(graph,'leisure', 'park');
        var grassLeisure = filterGraph(graph,'landuse', 'grass');
        var gardensLeisure = filterGraph(graph,'leisure', 'garden');
        var playGroundLeisure = filterGraph(graph,'leisure', 'playground');
        var pitchGroundLeisure = filterGraph(graph,'leisure', 'pitch');
        var recreationGroundLeisure = filterGraph(graph,'leisure', 'recreation_ground');
        var constructionLeisure = filterGraph(graph,'landuse', 'construction');
        var cemetery = filterGraph(graph,'landuse', 'cemetery');
        var water = filterGraph(graph,'natural', 'water');
        var pedestrianZone = filterGraph(graph, 'area:highway', 'pedestrian');

        var hospitals = filterGraph(graph, 'amenity', 'hospital');
        var parkings = filterGraph(graph, 'amenity', 'parking');
        var schools = filterGraph(graph, 'amenity', 'school');
        var college = filterGraph(graph, 'amenity', 'college');

        //ROADS
        var primary = filterGraph(graph, 'highway', 'primary');
        var residential = filterGraph(graph, 'highway', 'residential');
        var secondary = filterGraph(graph, 'highway', 'secondary');
        var unclassified = filterGraph(graph, 'highway', 'unclassified');
        var pedestrian = filterGraph(graph, 'highway', 'secondary_link');
        var footway = filterGraph(graph, 'highway', 'footway');
        var tertiary = filterGraph(graph, 'highway', 'tertiary');


        //BUILDINGS
        drawBuildings(buildings,parent,0xC9C3AF,20,0);
        drawBuildings(hospitalsBuildings,parent,0xC9C3AF,20,0);

        //PARKS
        drawLeisure(parksLeisure,parent,0xc8facc,1,1);
        drawLeisure(playGroundLeisure,parent,0xcccccc, 1.2);
        drawLeisure(pitchGroundLeisure,parent,0xcccccc, 1,1.2);
        drawLeisure(recreationGroundLeisure,parent,0xcccccc, 1,1.2);
        drawLeisure(cemetery,parent,0x90cb7c,1,1);
        drawLeisure(grassLeisure,parent,0xcdeab0,1,1.4);
        drawLeisure(gardensLeisure,parent,0x90cb7c,1,1.4);
        drawLeisure(constructionLeisure,parent,0x333333,1,1.4);
        drawLeisure(pedestrianZone,parent,0xAD7979,1,1.4);
        drawLeisure(schools,parent,0xD1DBB4,1,0.5);
        drawLeisure(college,parent,0xD1DBB4,1,0.5);

        //FLOOR SIGNAGE
        drawLeisure(parkings,parent,0xAD7979,1,1);
        drawLeisure(hospitals,parent,0xB4D1DB,1,0.5);
        //WATER
        drawLeisure(water, parent,0x3e7a8b,1,1.3);

        //ROADS
        drawLanes(primary,parent,0xffffff,150,2);
        drawLanes(secondary,parent,0xffffff,150,2);
        drawLanes(residential,parent,0xffffff,15,2);
        drawLanes(pedestrian,parent,0xffffff,2,2);
        drawLanes(footway,parent,0xD6A394,2,2);
        drawLanes(unclassified,parent,0xffffff,15,2);

        var light = new THREE.PointLight( 0xffffff , 0.7);
        light.position.copy( camera.position );

        scene.add( light );
        renderer.render(scene, camera);
    }

    function render() {
        renderer.render(scene, camera);
    }

    function animate() {
        window.requestAnimationFrame(animate);
        render();
    }

    setup();
    animate();
});

function getMap3DObject()
{
    return parent;
}