let data_keyword_mb = {}
let data_all_authorlist = {}
let data_mb
let data_all_keywordlist = {}
let data_all_links = {}

let data_tag = {}
let data_conbine = {}

let FILTER_AUTHOR_MIN = 40
let FILTER_KEYWORD_MIN = 20
let FILTER_LINK_MIN = 10

// let keyword_pos_set = {"VERB":1, "NOUN":1, "ADJ":1, "PROPN":1, "ADV":1}
let keyword_pos_set = {"VERB":1, "NOUN":1, "ADJ":1}
let ner_set = {"AT":1, "RT":1, "CARDINAL":1, "TIME":1, "DATE":1, "ORDINAL":1, "PERCENT":1, "MONEY":1}

let keyword_blacklist = {}
let author_blacklist = {}//{"@KronosQuoth":1, "@Clevvah4Evah":1}

// d3.json("http://localhost:8080/VAST2021_MC1_MC3/MC3_project/MC3_utf8/ner/parse_ner.json").then(function(data){
d3.json("./data/parse_ner.json").then(function(data){  
    // console.log(data)
    for(let itemID in data){
        data_keyword_mb[itemID] = []
        item = data[itemID]
        // for(let i=0; i<item.token.length; i+=1){
        //     let kw = item.token[i].toLowerCase()
        //     if(item.pos[i] in keyword_pos_set){
        //         data_keyword_mb[itemID].push(kw)
        //         let t_kw
        //         if(data_all_keywordlist.hasOwnProperty(kw)){
        //             t_kw = data_all_keywordlist[kw]
        //         }else{
        //             t_kw = {"value": 0}
        //         }
        //         t_kw.value += 1
        //         data_all_keywordlist[kw] = t_kw
        //     }
        // }
        for(let i=0; i<item.ner_token.length; i+=1){
            let kw = item.ner_token[i][0].toLowerCase()
            if (item.ner_token[i][1] in keyword_pos_set){
                data_keyword_mb[itemID].push(kw)
                let t_kw
                if(data_all_keywordlist.hasOwnProperty(kw)){
                    t_kw = data_all_keywordlist[kw]
                }else{
                    t_kw = {"value": 0}
                }
                t_kw.value += 1
                data_all_keywordlist[kw] = t_kw
            }
        }
        for(let ner in item.ner){
            // console.log(ner)
            if(!(ner in ner_set)){
                // console.log(item.ner[ner])
                for(let i=0; i<item.ner[ner].length; i+=1){
                    let kw = item.ner[ner][i].toLowerCase()
                    // console.log(kw)
                    data_keyword_mb[itemID].push(kw)
                    let t_kw
                    if(data_all_keywordlist.hasOwnProperty(kw)){
                        t_kw = data_all_keywordlist[kw]
                    }else{
                        t_kw = {"value": 0}
                    }
                    t_kw.value += 1
                    data_all_keywordlist[kw] = t_kw
                }
            }
        }
    }
    console.log("parse_ner file loaded")
    // parse_ner_file_loaded = true
}).then(()=>{
    d3.json("./data/microblog.json").then(function(data){
        data_mb = data
        for(let itemID in data){
            item = data[itemID]
            let aut = item.author
            if (aut=="") aut = "ccdata"
            aut = "@" + aut
            let t_aut
            if(data_all_authorlist.hasOwnProperty(aut)){
                t_aut = data_all_authorlist[aut]
            }else{
                t_aut = {"value": 0}
            }
            t_aut.value += 1
            data_all_authorlist[aut] = t_aut
        }
        console.log("microblog file loaded")
        // microblog_file_loaded = true
    }).then(afterloaded)
})

function filter_authorlist(){
    data_authorlist = {}
    for(let aut in data_all_authorlist){
        if (data_all_authorlist[aut].value<FILTER_AUTHOR_MIN) continue
        data_authorlist[aut] = {"value": data_all_authorlist[aut].value}
    }
}
function filter_keyword(){
    data_keywordlist = {}
    for(let kw in data_all_keywordlist){
        if (data_all_keywordlist[kw].value<FILTER_KEYWORD_MIN) continue
        data_keywordlist[kw] = {"value": data_all_keywordlist[kw].value}
    }
    for(let aut in data_all_authorlist){
        if (data_all_authorlist[aut].value>=FILTER_AUTHOR_MIN) continue
        if (data_all_authorlist[aut].value<FILTER_KEYWORD_MIN) continue
        data_keywordlist[aut] = {"value": data_all_authorlist[aut].value, "type": "author"}
    }
}
function filter_all_link(){
    data_all_links = {}
    for(let mbID in data_keyword_mb){
        let kwlist = data_keyword_mb[mbID]
        let aut = data_mb[mbID].author
        if (aut=="") aut = "ccdata"
        aut = "@" + aut
        if(aut in author_blacklist) continue
        for(let kwID in kwlist){
            let kw = kwlist[kwID]
            let linkkey = aut + "," + kw
            let link
            if (data_all_links.hasOwnProperty(linkkey)){
                link = data_all_links[linkkey]
            }else{
                link = {"value": 0}
            }
            link.value += 1
            data_all_links[linkkey] = link
        }
        for(let kw1ID=0; kw1ID<kwlist.length; kw1ID+=1){
            let kw1 = kwlist[kw1ID]
            for(let kw2ID=kw1ID+1; kw2ID<kwlist.length; kw2ID+=1){
                let kw2 = kwlist[kw2ID]
                let linkkey
                let link
                if (data_all_links.hasOwnProperty(kw1 + "," + kw2)){
                    linkkey = kw1 + "," + kw2
                    link = data_all_links[linkkey]
                }else if (data_all_links.hasOwnProperty(kw2 + "," + kw1)){
                    linkkey = kw2 + "," + kw1
                    link = data_all_links[linkkey]
                }else{
                    linkkey = kw1 + "," + kw2
                    link = {"value": 0}
                }
                link.value += 1
                data_all_links[linkkey] = link
            }
        }
    }
}
function afterloaded(){
    console.log(force_links)
    console.log("afterloaded")
    // for(let aut in data_all_authorlist){
    //     if (data_all_authorlist[aut].value<40) continue
    //     data_authorlist[aut] = {"value": data_all_authorlist[aut].value}
    // }
    filter_authorlist()
    // for(let kw in data_all_keywordlist){
    //     if (data_all_keywordlist[kw].value<20) continue
    //     data_keywordlist[kw] = {"value": data_all_keywordlist[kw].value}
    // }
    filter_keyword()
    // for(let mbID in data_keyword_mb){
    //     let kwlist = data_keyword_mb[mbID]
    //     let aut = data_mb[mbID].author
    //     if (aut=="") aut = "ccdata"
    //     aut = "@" + aut
    //     for(let kwID in kwlist){
    //         let kw = kwlist[kwID]
    //         let linkkey = aut + "," + kw
    //         let link
    //         if (data_all_links.hasOwnProperty(linkkey)){
    //             link = data_all_links[linkkey]
    //         }else{
    //             link = {"value": 0}
    //         }
    //         link.value += 1
    //         data_all_links[linkkey] = link
    //     }
    //     for(let kw1ID=0; kw1ID<kwlist.length; kw1ID+=1){
    //         let kw1 = kwlist[kw1ID]
    //         for(let kw2ID=kw1ID+1; kw2ID<kwlist.length; kw2ID+=1){
    //             let kw2 = kwlist[kw2ID]
    //             let linkkey
    //             let link
    //             if (data_all_links.hasOwnProperty(kw1 + "," + kw2)){
    //                 linkkey = kw1 + "," + kw2
    //                 link = data_all_links[linkkey]
    //             }else if (data_all_links.hasOwnProperty(kw2 + "," + kw1)){
    //                 linkkey = kw2 + "," + kw1
    //                 link = data_all_links[linkkey]
    //             }else{
    //                 linkkey = kw1 + "," + kw2
    //                 link = {"value": 0}
    //             }
    //             link.value += 1
    //             data_all_links[linkkey] = link
    //         }
    //     }
    // }
    filter_all_link()

    set_force_graph()
    refresh_force()
}

function find_conbine(kw){
    if (data_conbine.hasOwnProperty(kw)){
        return find_conbine(data_conbine[kw])
    }else{
        return kw
    }
}