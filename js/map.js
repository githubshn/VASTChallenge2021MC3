let mapdiv = d3.select("div#map")
let size = 1000
let svg = mapdiv.append("svg")
    .attr("width", size)
    .attr("height", size)

let minx=100, miny=100

function pointTranslate(coordinates, dx, dy, scale){
    ret = ""
    coordinates = coordinates.split(" ")
    // console.log(coordinates)
    for(let c in coordinates){
        cc = coordinates[c].split(",")
        x = parseFloat(cc[0])
        y = parseFloat(cc[1])
        // console.log(x, y)
        if(minx>x) minx = x
        if(miny>y) miny = y
        // console.log(cc)
        x = (x+dx) * scale
        y = (y+dy) * scale
        ret = ret + x + "," + y + " " 
    }
    return ret
}

d3.json("./data-processing/streets.json", function(data){
    // console.log(data)
    svgg = svg.append("g").attr("id", "map")
    for(let group in data){
        let g = svgg.append("g")
            .attr("id", group.split(" ").join("-"))
            .attr("transform", "matrix(10,0,0,-10,0,"+size*2/3+")") // 放大十倍，同时上下颠倒，并调整y方向偏移量
        for(street in data[group]){
            let id = ""
            if(data[group][street]["name"]!=null)
                id = data[group][street]["name"].split(" ").join("-")
            else
                id = "null"
            g.append("polyline")
                .attr("id", id)
                .attr("points", pointTranslate(data[group][street]["coordinates"], -24.82, -36.04, 1000)) // 减去基准量，让地图出现在中间
                .style("fill", 'none')
                .style("stroke", 'black')
                .style('stroke-width', 0.1)
                .on("mouseover", ()=>{
                    let self = d3.selectAll("polyline#"+id)
                    console.log(self.attr("id"))
                    self.style("stroke", "blue")
                        .style("stroke-width", 0.25)
                })
                .on("mouseout", ()=>{
                    let self = d3.selectAll("polyline#"+id)
                    console.log(self.attr("id"))
                    self.style("stroke", "black")
                        .style("stroke-width", 0.1)
                })
                .on("click", ()=>{
                    highlight_street(group)
                })
        }
        // break
    }
    // svgg.attr("transform", "translate(-20, -30) scale(15)")
    console.log("min", minx, miny)
    // highlight_street("S Wenna St")
})

function highlight_street(name){
    svg.selectAll("polyline")
        .style("stroke", "black")
        .style("stroke-width", 0.1)
    name = name.split(" ").join("-")
    svg.select("g#"+name).selectAll("*")
        .style("stroke", "red")
        .style("stroke-width", 0.25)
}
