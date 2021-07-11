let control_log = []
let div_control = d3.select("div#control_board")


div_control.append("h1")
    // .attr("class", "h1")
    .attr("id", "title")
    .text("Control Board")


div_control.append("h2")
    .attr("id", "control_force_graph")
    .text("Force graph parameters:")
control_add_range(div_control, "force decay:", 0, 0.1, 0.05, "linkstrength", ()=>{
    let value = d3.event.target.value
    FORCE_DEC = value
    refresh_force()
})
control_add_range(div_control, "charge force strength:", 1, 100, 50, "chargestrength", ()=>{
    let value = d3.event.target.value
    FORCE_CHARGE = value
    refresh_force()
})
control_add_range(div_control, "center force x strength:", 0, 0.1, 0.02, "centerforcex", ()=>{
    let value = d3.event.target.value
    FORCE_CENTER_X = value
    refresh_force()
})
control_add_range(div_control, "center force y strength:", 0, 0.5, 0.02, "centerforcey", ()=>{
    let value = d3.event.target.value
    FORCE_CENTER_Y = value
    refresh_force()
})
control_add_range(div_control, "link strength:", 0, 1, 0.1, "linkstrength", ()=>{
    let value = d3.event.target.value
    FORCE_LINK_STRENGTH = value
    refresh_force()
})
let show_force_tag = true
control_add_choosebox(div_control, "tag", ["show", "hide"], "force_tag", ()=>{
    let value = d3.event.target.value
    if(value=="show"){
        show_force_tag = true
    }else{
        show_force_tag = false
    }
    force_ticked()
})
// div_control.select("#force_tag_form").attr("selected")




let current_clicked_list = null
div_control.append("h2")
    .text("Lists Control:")
let list_info = div_control.append("g").attr("id", "list_info")
list_info.append("h3")
    .attr("id", "list_name")
    .text("name:")
list_info.append("h3")
    .attr("id", "list_type")
    .text("type:")

list_info.append("button")
    // .style("margin-top", "20px")
    .text("free")
    .attr("class", "control_button")
    .attr("id", "list_free")
    .on("click", ()=>{
        if (current_clicked_list==null) return

        control_log.push({"type":"free", "target":[current_clicked_list.name]})

        current_clicked_list.show = true
        current_clicked_list.fx = null
        current_clicked_list.fy = null
        if (current_clicked_list.type=="author"){
            delete data_authorlist[current_clicked_list.name]
        }else if(current_clicked_list.type=="location"){
            delete data_locationlist[current_clicked_list.name]
        }
        data_keywordlist[current_clicked_list.name] = {
            "value": current_clicked_list.value,
            "force_node": current_clicked_list,
        }
        draw_authorlist(data_authorlist)
        draw_locationlist(data_locationlist)
        refresh_force()
        current_clicked_list = null
        list_info.select("#list_name").text("name: ")
        list_info.select("#list_type").text("type: ")
    })


let current_clicked_node = null
div_control.append("h2")
    .text("Nodes Control:")
let node_info = div_control.append("g").attr("id", "node_info")
node_info.append("h3")
    .attr("id", "node_name")
    .text("name:")
control_add_choosebox(node_info, "type", ["keyword", "author", "location"], "node_type", ()=>{
    console.log("change type to "+d3.event.target.value)
    let ntype = d3.event.target.value
    data_all_keywordlist[current_clicked_node.name].type = ntype
    current_clicked_node.type = ntype
    force_ticked()

    control_log.push({"type":"type-change", "target":[current_clicked_node.name, ntype]})

})
node_info.append("h3")
    .attr("id", "node_value")
    .text("value:")
control_add_textbox(node_info, "tag", null, "node_tag", ()=>{
    let ntag = d3.event.target.value
    console.log("ntag", ntag)
    let otag = null
    if(current_clicked_node.hasOwnProperty("tag")) otag = current_clicked_node.tag
    data_all_keywordlist[current_clicked_node.name].tag = ntag
    current_clicked_node.tag = ntag
    // 修改data_tag集合
    if(!data_tag.hasOwnProperty(ntag)) data_tag[ntag] = {"nodes": new Set(), "color": "black"}
    data_tag[ntag].nodes.add(current_clicked_node.name)
    if(otag!=null) data_tag[otag].nodes.delete(current_clicked_node.name)
    // 重构力导向图
    set_force_graph_link()
    refresh_force()


    control_log.push({"type":"tag", "target":[current_clicked_node.name, ntag]})
})
control_add_textbox(node_info, "tag-color", null, "node_tag_color", ()=>{
    let self = d3.event.target
    let tag = node_info.select("#node_tag")._groups[0][0].value
    data_tag[tag].color = self.value
    set_force_graph_link()
    refresh_force()

    control_log.push({"type":"tag-color", "target":[tag, self.value]})
})
node_info.append("button")
    .style("margin-top", "20px")
    .text("delete")
    .attr("class", "control_button")
    .attr("id", "node_delete")
    .on("click", ()=>{
        if(current_clicked_node==null) return
        control_log.push({"type":"del", "target":[current_clicked_node.name]})
        data_keywordlist[current_clicked_node.name].force_node.show = false
        delete data_keywordlist[current_clicked_node.name]
        // set_force_graph_node()
        set_force_graph_link()
        refresh_force()
        node_info_free()
    })
node_info.append("button")
    .style("margin-top", "20px")
    .text("setLocation")
    .attr("class", "control_button")
    .attr("id", "node_setLocation")
    .on("click", ()=>{
        if(current_clicked_node==null) return
        let name = current_clicked_node.name
        data_locationlist[name] = {
            "type": "setLocation",
            "force_node": current_clicked_node
        }
        current_clicked_node.show = false
        current_clicked_node.type = "location"
        draw_locationlist(data_locationlist)
        control_log.push({"type":"setLocation", "target":[current_clicked_node.name]})
    })
node_info.append("button")
    .style("margin-top", "20px")
    .text("setAuthor")
    .attr("class", "control_button")
    .attr("id", "node_setAuthor")
    .on("click", ()=>{
        if(current_clicked_node==null) return
        let name = current_clicked_node.name
        data_authorlist[name] = {
            "type": "setAuthor",
            "force_node": current_clicked_node
        }
        current_clicked_node.show = false
        current_clicked_node.type = "author"
        draw_authorlist(data_authorlist)
        control_log.push({"type":"setAuthor", "target":[current_clicked_node.name]})
    })
let current_center_node = null
node_info.append("button")
    .style("margin-top", "20px")
    .text("center")
    .attr("class", "control_button")
    .attr("id", "node_center")
    .on("click", ()=>{
        if(!current_center_node==null){
            current_center_node.fx = null
            current_center_node.fy = null
        }
        if(current_center_node.name==current_clicked_node.name) return
        current_center_node = current_clicked_node
        current_center_node.fx = width/2
        current_center_node.fy = force_height/2
        refresh_force()
        force_ticked()
    })



let node_selected_1 = null, node_selected_2 = null
node_info.append("h3")
    .attr("id", "node_conbine_text")
    .text("selected: null, null")
node_info.append("button")
    .text("conbine")
    .attr("class", "control_button")
    .attr("id", "node_conbine")
    .on("click", ()=>{
        let node1 = null
        if(data_keywordlist.hasOwnProperty(node_selected_1)) node1 = data_keywordlist[node_selected_1]
        let node2 = null
        if(data_keywordlist.hasOwnProperty(node_selected_2)) node2 = data_keywordlist[node_selected_2]
        if (node1!=null && node2!=null){
            // add_new_link({
            //     "target": node_selected_1,
            //     "source": node_selected_2,
            //     "type": "conbine",
            // })
            control_log.push({"type":"conbine", "target":[node_selected_1, node_selected_2]})
            data_conbine[node_selected_2] = node_selected_1
            data_keywordlist[node_selected_1].force_node.value += data_keywordlist[node_selected_2].force_node.value
            data_keywordlist[node_selected_2].force_node.show = false
            set_force_graph_link()
            refresh_force()
        }
    })

function node_info_free(){
    current_clicked_node = null
    node_info.select("#node_name").text("name: ")
    node_info.select("#node_value").text("value: ")
}


div_control.append("h2")
    .text("Filter Control:")
let filter = div_control.append("g").attr("id", "filter")
control_add_range(filter, "filter keyword:", 0, 100, FILTER_KEYWORD_MIN, "filter_node_min", ()=>{
    let value = d3.event.target.value
    // FORCE_DEC = value
    // refresh_force()
    FILTER_KEYWORD_MIN = parseInt(value)
    filter_keyword()
    set_force_graph()
    refresh_force()
})
control_add_range(filter, "filter author:", 0, 100, FILTER_AUTHOR_MIN, "filter_author_min", ()=>{
    let value = d3.event.target.value
    FILTER_AUTHOR_MIN = parseInt(value)
    filter_authorlist()
    filter_keyword()
    set_force_graph()
    refresh_force()
})
control_add_range(filter, "filter link:", 0, 100, FILTER_LINK_MIN, "filter_link_min", ()=>{
    let value = d3.event.target.value
    FILTER_LINK_MIN = parseInt(value)
    set_force_graph_link()
    refresh_force()
})

// div_control.append("h2")
//     .text("save")
// div_control.append("button")
//     .text("save")
//     .attr("class", "control_button")
//     .attr("id", "save")
//     .on("click", ()=>{

//     })

function control_add_range(parent, name, min, max, defaultvalue, id, onchange){
    let g = parent.append("g").attr("id", "g_"+id)
    g.append("h3").attr("id", id + "_title")
        .text(name + defaultvalue)
    g.append("input").attr("type", "range")
        .attr("class", "input_range")
        .attr("id", id)
        .attr("min", min)
        .attr("max", max)
        .attr("value", defaultvalue)
        .attr("step", (max-min)/100)
        // .attr("value", defaultvalue)
        // .value(defaultvalue)
        // .on("change", ()=>{
        //     let value = d3.event.target.value
        //     console.log(value)
        // })
        .on("change", onchange)
        .on("mousemove", ()=>{
            let value = d3.event.target.value
            g.select("#"+id+"_title").text(name + value)
        })
}
function control_add_textbox(parent, name, value, id, onchange){
    let g = parent.append("g").attr("id", "g_"+id)
    g.append("h3").attr("id", id + "_title")
        .text(name)
    g.append("input").attr("type", "text")
        .attr("class", "input_text")
        .attr("id", id)
        .attr("value", value)
        .on("change", onchange)
        // .on("change", ()=>{
        //     let value = d3.event.target.value
        //     console.log(value)
        // })
}

function control_add_choosebox(parent, name, valuelist, id, onchange){
    let g = parent.append("g").attr("id", "g_"+id)
    g.append("h3").attr("id", id+"_title")
        .text(name)
    let form = g.append("form").attr("id", id+"_form")
        .style("margin-left", "20px")
    let gi = form.selectAll("input")
        .data(valuelist)
        .enter()
        .append("g")
    gi.append("input").attr("type", "radio").attr("name", id)
        .attr("value", (d)=>(d))
        .on("click", onchange)
    gi.append("text")
        .text((d)=>(d))
}

function control_keywords(){

}

