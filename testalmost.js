/**
 * Created by elodie on 07/10/15.
 */
var renderer, scene, camera, controls;

var width = 1600;
var height = 800;

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
var minlon = -71.06310;
var maxlat = 42.35904;
var maxlon = -71.05197;
var minlat = 42.35226;

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

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function buildAxes( length ) {
    var axes = new THREE.Object3D();

    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

    return axes;

}
function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),
        mat;

    if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LineSegments );

    return axis;

}
function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = a[i];
        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}
function initRenderer(width,height,color)
{
    renderer.setSize(width, height);
    renderer.setClearColor( color );
    renderer.shadowMapEnabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    document.body.appendChild(renderer.domElement);
}
function initScene()
{

}
function initCamera()
{
    camera = new THREE.PerspectiveCamera(
        35,             // Field of view
        960 / 500,      // Aspect ratio
        0.1,            // Near plane
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

function drawBuildings (buildings,parent,color,extrudeAmount, elevation) {
    var extrudeSettings = { amount: extrudeAmount,  bevelEnabled: false, steps: 1 };
    var elevation = (elevation) ? elevation : 0;
    var polygons = buildings.map(function(b)
    {
        var height = (b.tags["building:height"] !== undefined) ? parseInt(b.tags["building:height"]) : extrudeSettings.amount;
        var color = (b.tags["building:colour"] !== undefined) ? new THREE.Color(b.tags["building:colour"]) : new THREE.Color(color);
        color = color.getHex();
        var position = b.nodes.map(function(n){return projection([n.lon, n.lat]);});

        return {
            height : height,
            color: color,
            position: position
        }
    });

    polygons.map(function(p) {
        var building = new THREE.Shape();

        //Move building to ???
        building.moveTo(p.position[0][0], p.position[0][1] * -1);

        //Draw lines
        for (var i = 1; i < p.position.length; i++) {
            building.lineTo(p.position[i][0], p.position[i][1] * -1);
        }

        //Extrude
        extrudeSettings.amount = p.height;
        var geometry = new THREE.ExtrudeGeometry(building, extrudeSettings);
        var geoMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(
        {
            color: p.color,
        }));
        geoMesh.position.setZ(elevation);
        geoMesh.castShadow = true;
        geoMesh.receiveShadow = false;
        var egh = new THREE.EdgesHelper( geoMesh, 0x666666 );
        egh.material.linewidth = 1;
        scene.add( egh );
        parent.add( geoMesh);
        console.log("create Building");
    });
}

function drawLanes (graph,parent,color,extrudeAmount,elevation) {
    var extrudeSettings = { amount: extrudeAmount,  bevelEnabled: false, steps: 1 };
    var width = 2;
    var elevation = (elevation) ? elevation : 0;
    var lanes = _.filter(graph.entities, function(e) {
        return e.type == 'way' && e.tags.highway && (
            e.tags.highway == "primary" ||
            e.tags.highway == "residential" ||
            e.tags.highway == "secondary" ||
            e.tags.highway == "secondary_link" ||
            e.tags.highway == "pedestrian"||
            e.tags.highway == "footway" ||
            e.tags.highway == "tertiary"
            );
    });

    var coordinates = lanes.map(function(b) {
        return graph.fetch(b.id);
    });

    var polygons = coordinates.map(function(b) {
        var width = 2;
        var position = b.nodes.map(function(n){return projection([n.lon, n.lat]);});
        width = (b.tags['width']) ? parseFloat(b.tags['width']) : width;
        var id = b._id;
        var name = (b.tags.name) ? b.tags.name : null;

        return {position: position, width:width, id:id, name: name};
    });



    var aggregate_poly = {};
    for(var i=0; i < polygons.length; i++)
    {
        var poly1 = polygons[i];
        for(var ii =0; ii < polygons.length; ii++)
        {
            var poly2 = polygons[ii];
            if(i !== ii && poly1.name !== null && poly2.name !== null && poly1.name == poly2.name)
            {
                aggregate_poly[poly1.name] = poly1;
                for(var iii = 0; iii < poly2.position.length; iii++)
                    aggregate_poly[poly1.name].position.push(poly2.position[iii]);
            }
        }
    }

    var final_poly =  [];
    /*for(var i=0; i < polygons.length; i++)
    {
        var poly1 = polygons[i];
        if(poly1.name === null)
            final_poly.push(poly1);
    }*/

    for(keys in aggregate_poly)
    {
        if(aggregate_poly.hasOwnProperty(keys))
        {
            //aggregate_poly[keys].position = uniq_fast(aggregate_poly[keys].position);
            final_poly.push(aggregate_poly[keys]);
        }
    }

    debugger;
    final_poly.map(function(p) {

        var geometry = new THREE.Geometry();
        //Move building to ???

        //building.moveTo(p[0][0], p[0][1]*-1);

        //Draw lines
        var cnt = 0;
        var milk = [];
        if(p.name == "Milk Street")
            milk.push(p.position);
        for (var i = 1; i < p.position.length; i++)
        {
            if(p.name == "Milk Street")
            {
                //cnt++;
                //console.log(p.position[i][0], p.position[i][1]*-1,0);
                //console.log(new THREE.Vector3( p.position[i][0], p.position[i][1]*-1,0));

            }
            geometry.vertices.push(
                new THREE.Vector3( p.position[i][0], p.position[i][1]*-1,0)
            );
            /*geometry.vertices.push(
                new THREE.Vector3( p.position[i][0], p.position[i][1]*-1,0)
            );*/

        }
        if(p.name == "Milk Street")
        {
            color = 0xff0000;
            console.log(milk);
        }
        else{ color = 0xffffff}
        //Extrude
        //geometry = new THREE.ExtrudeGeometry( geometry, extrudeSettings);
        if(p.name == "Milk Street") {
            var pointMat = new THREE.PointsMaterial({color: 0x000000, size: 15});
            particles = new THREE.Points(geometry, pointMat);
            particles.position.setZ(2);
            scene.add(particles);
        }

        var geoMesh = new THREE.LineBasicMaterial({ linewidth: p.width, color: (color) ? color : getRandomColor() });
        var line = new THREE.Line(geometry, geoMesh);
        var egh = new THREE.EdgesHelper( line, 0x666666 );
        egh.material.linewidth = 1;
        line.position.setZ(1);
        parent.add(line);
        console.log("create Lane");
    });
}


function drawLeisure (leisure,parent,color,extrudeAmount, elevation) {
    //k="leisure" v="park"/>
    var extrudeSettings = { amount: extrudeAmount,  bevelEnabled: false, steps: 1 };

    var elevation = (elevation) ? elevation : 0;
    var polygons = leisure.map(function(b)
    {
        var position = b.nodes.map(function(n){return projection([n.lon, n.lat]);});
        return {
            position: position
        }
    });

    polygons.map(function(p) {
        var park = new THREE.Shape();

        //Move building to ???
        park.moveTo(p.position[0][0], p.position[0][1] * -1);

        //Draw lines
        for (var i = 1; i < p.position.length; i++) {
            park.lineTo(p.position[i][0], p.position[i][1] * -1);
        }

        //Extrude
        var geometry = new THREE.ExtrudeGeometry(park, extrudeSettings);
        //geometry.position.z = elevation;
        var geoMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(
        {
            color: color
        }));
        geoMesh.position.setZ(elevation);
        geoMesh.castShadow = false;
        geoMesh.receiveShadow = true;
        var egh = new THREE.EdgesHelper( geoMesh, 0x666666 );
        egh.material.linewidth = 1;
        scene.add( egh );
        parent.add( geoMesh);
        console.log("create Leisure");
    });
}
var connection = iD.Connection();

connection.bboxFromAPI(bbox, function(graph) {


    renderer = new THREE.WebGLRenderer();

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
        var parksLeisure = filterGraph(graph,'leisure', 'park');
        var grassLeisure = filterGraph(graph,'landuse', 'grass');
        var gardensLeisure = filterGraph(graph,'leisure', 'garden');
        var playGroundLeisure = filterGraph(graph,'leisure', 'playground');
        var recreationGroundLeisure = filterGraph(graph,'leisure', 'pitch');
        var constructionLeisure = filterGraph(graph,'landuse', 'construction');
        var water = filterGraph(graph,'natural', 'water');

        drawBuildings(buildings,parent,0xffffff,20,0);

        drawLeisure(parksLeisure,parent,0xc8facc,1,1);
        drawLeisure(playGroundLeisure,parent,0xcccccc, 1,1.4);
        drawLeisure(recreationGroundLeisure,parent,0xcccccc, 1,1.4);
        drawLeisure(water, parent,0x3e7a8b,1,1.4);
        drawLeisure(grassLeisure,parent,0xcdeab0,1,2);
        drawLeisure(gardensLeisure,parent,0x90cb7c,1,3);
        drawLeisure(constructionLeisure,parent,0xffffff,1,3);
        drawLanes(graph,parent,null,1,2);

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