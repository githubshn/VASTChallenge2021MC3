let div_relation = d3.select("div#relation")
let div_authorlist = div_relation.select("div#author_list")
let div_locationlist = div_relation.select("div#location_list")
let div_force = div_relation.select("div#force")

let FORCE_CHARGE = 50
let FORCE_CENTER_X = 0.02
let FORCE_CENTER_Y = 0.02
let FORCE_LINK_STRENGTH = 0.1
let FORCE_DEC = 0.05

// test data
let data_authorlist = {}
let data_locationlist = {
    // "CityPark": {"value": 1},
}
let data_keywordlist = {}

let width = document.body.clientWidth*0.74, height = document.body.clientHeight * 0.97
let list_height = height * 0.1
let force_height = height * 0.8
let MAX_LIST_LEN = 10

let colormap_node_type = {
    "keyword": "#1c7887",
    "author": "grey",
    "location": "orange",
}
let colormap_node_tag = {
    "normal": null,
    "clicked": "red",
}
let colormap_list = {
    "location": "#8dd3c7",
    "author": "#80b1d3"
}
let color_link = "#8dd3c7"

let svg_authorlist = div_authorlist.append("svg")
    .attr("id","svg_authorlist")
    .attr("class", "svg_list")
    .attr("width", width)
    .attr("height", list_height)

let svg_force = div_force.append("svg")
    .attr("id","svg_force")
    .attr("class", "svg_force")
    .attr("width", width)
    .attr("height", force_height)

let svg_locationlist = div_locationlist.append("svg")
    .attr("id","svg_locationlist")
    .attr("class", "svg_list")
    .attr("width", width)
    .attr("height", list_height)

let simulation
let force_nodes = []
let force_links = []

force_links = [
    // {"target":"CityPark", "source":"park", "value":10},
    // {"target":"CityPark", "source":"rally", "value":10},
    // {"target":"A", "source":"aa", "value":1},
    // {"target":"aa", "source":"a", "value":1},
    // {"target":"aa", "source":"bb", "value":1},
    // {"target":"aa", "source":"b", "value":2},
    // {"target":"B", "source":"bb", "value":1},
    // {"target":"bb", "source":"b", "value":1},
    // {"target":"C", "source":"cc", "value":1},
]

let svg_force_links = svg_force.append("g").attr("id", "svg_force_link").selectAll("line")
let svg_force_nodes = svg_force.append("g").attr("id", "svg_force_nodes").selectAll("circle")
let svg_force_nodes_text = svg_force.append("g").attr("id", "svg_force_nodes_text").selectAll("text")

function draw_authorlist(data_authorlist){
    svg_authorlist.selectAll("*").remove()
    let num = Object.keys(data_authorlist).length
    let eachwidth = width / num * 0.75
    let interval = width / num * 0.25
    let eachheight = list_height * 0.8
    let x_offset = interval/2, y_offset = list_height*0.1
    let autID = 0;
    for(let aut in data_authorlist){
        let tx = x_offset + autID * (eachwidth + interval), ty = y_offset
        data_authorlist[aut]["force_node"]["fx"] = tx + eachwidth/2
        data_authorlist[aut]["force_node"]["fy"] = 0
        let g = svg_authorlist.append("g")
        g.append("rect")
            .attr("x", tx)
            .attr("y", ty)
            .attr("rx", eachheight*0.1)
            .attr("ry", eachheight*0.1)
            .attr("width", eachwidth)
            .attr("height", eachheight)
            .style("fill", colormap_list["author"])
            .attr("name", aut)
            .on("click", ()=>{
                current_clicked_list = data_authorlist[aut]["force_node"]
                list_info.select("#list_name").text("name: "+aut)
                list_info.select("#list_type").text("type: author")
            })
        let textheight = 10
        g.append("text")
            .text(()=>{
                if(aut.length>7){
                    return aut.substr(0, 6) + ".."
                }else{
                    return aut
                }
            })
            .attr("x", tx + eachwidth/2)
            .attr("y", ty + eachheight/2 - textheight/2)
            .attr("dy", textheight)
            .style("text-overflow", "ellipsis")
            .style("overflow", "hidden")
            .style("color", "red")
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .style("pointer-event", "none")
            .style("font-size", ()=>{
                let t = eachwidth/5
                if(t>20) return 20
                return t
            })
        autID += 1
    }
}
function draw_locationlist(data_locationlist){
    svg_locationlist.selectAll("*").remove()
    let num = Object.keys(data_locationlist).length
    let eachwidth = width / num * 0.75
    let interval = width / num * 0.25
    let eachheight = list_height * 0.8
    let x_offset = interval/2, y_offset = list_height*0.1
    let locID = 0
    for(let loc in data_locationlist){
        let tx = x_offset + locID * (eachwidth + interval), ty = y_offset
        data_locationlist[loc]["force_node"]["fx"] = tx + eachwidth/2
        data_locationlist[loc]["force_node"]["fy"] = force_height
        let g = svg_locationlist.append("g")
        g.append("rect")
            .attr("x", tx)
            .attr("y", ty)
            .attr("rx", eachheight*0.1)
            .attr("ry", eachheight*0.1)
            .attr("width", eachwidth)
            .attr("height", eachheight)
            .style("fill", colormap_list["location"])
            .on("click", ()=>{
                current_clicked_list = data_locationlist[loc]["force_node"]
                list_info.select("#list_name").text("name: "+loc)
                list_info.select("#list_type").text("type: location")
            })
        let textheight = 10
        g.append("text")
            .attr("x", tx + eachwidth/2)
            .attr("y", ty + eachheight/2 - textheight/2)
            .attr("dy", textheight)
            .text(loc)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
        locID += 1
    }
}

// console.log("generate nodes")

function set_force_graph_link(){
    force_links = []
    // 来自data_all_links的边
    // 处理conbine
    let all_links = {}
    for(let linkkey in data_all_links){
        let lk = linkkey.split(",")
        let target = lk[0], source = lk[1], value = data_all_links[linkkey].value
        target = find_conbine(target)
        source = find_conbine(source)
        if (target in keyword_blacklist || source in keyword_blacklist) continue
        if(target>source){
            let t = target
            target = source
            source = t
        }
        lk = target + "," + source
        let link
        if(all_links.hasOwnProperty(lk)){
            link = all_links[lk]
        }else{
            link = {"value": 0}
        }
        link.value += value
        all_links[lk] = link
    }
    for(let linkkey in all_links){
        // console.log(linkkey)
        let lk = linkkey.split(",")
        let target = lk[0], source = lk[1], value = all_links[linkkey].value
        // console.log(target, source)
        if (data_authorlist.hasOwnProperty(target) || data_keywordlist.hasOwnProperty(target)){
            if (data_keywordlist.hasOwnProperty(source)){
                if (value<FILTER_LINK_MIN) continue
                force_links.push({
                    "target": target,
                    "source": source,
                    "value": value,
                })
                // if(target[0]=="@") console.log(linkkey)
            }
        }
        // break
    }
    //来自tag的边
    for(let s in data_tag){
        let kwlist = Array.from(data_tag[s].nodes)
        for(let i=0; i<kwlist.length-1; i+=1){
            for(let j=i+1; j<kwlist.length; j+=1){
                force_links.push({
                    "target": kwlist[i],
                    "source": kwlist[j],
                    "value": 100,
                    "type": "tag",
                    "tag-name": s,
                })
            }
        }
    }
}
function set_force_graph_node(){
    force_nodes = []
    //构建力导向图需要的结点
    for(let aut in data_authorlist){
        let tmp = {
            "name": aut,
            "type": "author",
            "show": false,
            "value": data_authorlist[aut].value,
        }
        force_nodes.push(tmp)
        data_authorlist[aut]["force_node"] = tmp
    }
    for(let loc in data_locationlist){
        let tmp = {
            "name": loc,
            "type": "location",
            "show": false,
            "value": data_locationlist[loc].value,
        }
        force_nodes.push(tmp)
        data_locationlist[loc]["force_node"] = tmp
    }
    for(let kw in data_keywordlist){
        let type = "keyword"
        if(data_keywordlist[kw].hasOwnProperty("type")) type = data_keywordlist[kw].type
        let tmp = {
            "name": kw,
            "type": type,
            "show": true,
            "value": data_keywordlist[kw]["value"],
        }
        force_nodes.push(tmp)
        data_keywordlist[kw]["force_node"] = tmp
    }
}
function set_force_graph(){
    set_force_graph_node()
    set_force_graph_link()

    // 定义力导向模拟器
    simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody())
        .force('link', d3.forceLink())
        .force('y', d3.forceY(force_height / 2))
        .force('x', d3.forceX(width / 2))

    simulation.nodes(force_nodes)
        .on("tick", force_ticked)

}

// console.log(force_nodes)

// 力导向更新
function force_ticked(){
    svg_force_links
        .attr("x1", (d)=>(d.source.x))
        .attr("y1", (d)=>(d.source.y))
        .attr("x2", (d)=>(d.target.x))
        .attr("y2", (d)=>(d.target.y))
        .attr("fill", (d)=>{
            if(d.hasOwnProperty("type") && d.type=="tag"){
                return data_tag[d["tag-name"]].color
            }
            return color_link
        })
    svg_force_nodes
        .attr("transform", (d, i)=>{
            return "translate("+d.x+","+d.y+")"
        })
        .attr("fill", (d)=>(colormap_node_type[d.type]))
        .attr("stroke", (d)=>{
            let color = null
            if(d.hasOwnProperty("tag")) color = data_tag[d.tag].color
            if(current_clicked_node!=null && current_clicked_node.name==d.name) color = "red"
            return color
        })
        .attr("display", (d)=>{
            if(d.hasOwnProperty("show") && d.show==false) return "none"
            return "block"
        })
    svg_force_nodes_text
        .attr("transform", (d, i)=>{
            return "translate("+d.x+","+d.y+")"
        })
        .text((d)=>{
            if(d.hasOwnProperty("show") && d.show==false) return null
            if(!show_force_tag) return null
            return d.name
        })
}

function refresh_force(){
    simulation.alphaDecay(FORCE_DEC) // 衰减系数，值越大，图表稳定越快
    simulation.force('charge')
        .strength(-FORCE_CHARGE) // 排斥力强度，正值相互吸引，负值相互排斥
    simulation.force("y")
        .strength(FORCE_CENTER_Y)
    simulation.force("x")
        .strength(FORCE_CENTER_X)
    // simulation.force('link')
    //     .id(d => d.name) // set id getter
    //     .distance(0) // 连接距离
    //     .strength(1) // 连接力强度 0 ~ 1
    //     .iterations(1) // 迭代次数

    // 重新绑定边和点
    simulation.nodes(force_nodes)
        .on("tick", force_ticked)
    simulation.force("link")
        .id((d)=>{return d.name})
        .links(force_links)
        .distance((d)=>{
            // list-kw 连边
            if (d.target.type=="author" || d.target.type=="location") return 5
            // tag 连边
            if (d.hasOwnProperty("type")){
                if(d.type=="tag") return 5
                if(d.type=="conbine") return 0.1
                console.log("link type", d.type)
            }
            // 普通连边
            return 100 + 250 / d.value
        })
        .strength(FORCE_LINK_STRENGTH)

    // 重新模拟
    simulation.alphaTarget(0.5).restart()

    // 重新绘制
    // 绘制边
    svg_force.select("#svg_force_link").remove()
    svg_force_links = svg_force.append("g").attr("id", "svg_force_link")
        .selectAll("line")
        .data(force_links)
        .enter()
        .append("line")
        .attr("stroke", (d)=>{
            if(d.hasOwnProperty("type") && d.type=="tag"){
                return data_tag[d["tag-name"]].color
            }
            return color_link
        })
        .attr("stroke-width", (d)=>{
            if (d.value>100) return 1
            // if (d.value<10) return 0
            return d.value/100
        })

    // 绘制点
    svg_force.select("#svg_force_nodes").remove()
    svg_force_nodes = svg_force.append("g").attr("id", "svg_force_nodes")
        .selectAll("circle")
        .data(force_nodes)
        .enter()
        .append("circle")
        .attr("r", (d)=>{
            if (d.value>100) return 10
            return d.value/10
        })
        .attr("fill", (d)=>(colormap_node_type[d.type]))
        .attr("stroke-width", 2)
        .attr("stroke", (d)=>{
            let tag = "normal";
            if(d.hasOwnProperty("tag")) tag = d.tag
            return colormap_node_tag[tag]
        })
        .on("click", (d)=>{
            current_clicked_node = d

            node_info.select("#node_name").text("name: "+d.name)
            let typelist = node_info.select("#node_type_form").selectAll("input")["_groups"][0]
            for(let id in typelist){
                if(typelist[id].value==d.type){
                    typelist[id].checked = true
                    break
                }
            }
            node_info.select("#node_value").text("value: "+d.value)

            let tag = null
            if(d.hasOwnProperty("tag")) tag = d.tag
            node_info.select("#node_tag")["_groups"][0][0].value = tag
            let tag_color = null
            if(tag!=null) tag_color = data_tag[tag].color
            node_info.select("#node_tag_color")._groups[0][0].value = tag_color
            
            node_selected_1 = node_selected_2
            node_selected_2 = d.name
            node_info.select("#node_conbine_text").text("selected:"+node_selected_1 + ","+node_selected_2)
            
            force_ticked()
        })
        .call(d3.drag()
            .on("start", (d)=>{
                if(!d3.event.active){
                    simulation.alphaTarget(0.8).restart();//设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0，1]
                }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (d)=>{
                d.fx = d3.event.x
                d.fy = d3.event.y
            })
            .on("end", (d)=>{
                if(!d3.event.active){
                    simulation.alphaTarget(0)
                }
                d.fx = null;
                d.fy = null;
            })
        )

    // 绘制点上的文字
    svg_force.select("#svg_force_nodes_text").remove()
    svg_force_nodes_text = svg_force.append("g").attr("id", "svg_force_nodes_text")
        .selectAll("text")
        .data(force_nodes)
        .enter()
        .append("text")
        .attr("x", -10)
        .attr("y", -20)
        .attr("dy", 10)
        .style("user-select", "none")
        .style("pointer-events", "none")
        // .text((d)=>{
        //     if(!show_force_tag) return null
        //     return d.name
        //     if(d.type=="keyword" && d.show) return d.name
        //     return null
        // })

    // 绘制轨道
    draw_authorlist(data_authorlist)
    draw_locationlist(data_locationlist)
}

function add_new_link(newlink){
    force_links.push(newlink)
    refresh_force()
}

function add_new_nodes(newnode){
    force_nodes.push(newnode)
    refresh_force()
}
