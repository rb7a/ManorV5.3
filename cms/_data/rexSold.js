require('dotenv').config();
const EleventyFetch = require("@11ty/eleventy-fetch");

async function getPropertyData(){
    console.log("getPropertyData...")
    
     var Rex_User = process.env.REX_USERNAME;
     var Rex_Pass = process.env.REX_PASSWORD;
    //first step is get auth key
    let apibody = JSON.stringify({
        email:Rex_User,
        password:Rex_Pass,
        account_id: "4576"
    })

    // console.log(apibody)
    //Get Property Details
    const url = `https://api.rexsoftware.com/v1/rex/Authentication/login`
    const response = EleventyFetch(url, {
        duration: "0s",
        type: "json",
        fetchOptions: {
            method: "post",
            headers: {
                accept: 'application/json',
                'content-type': 'application/json'
            },
            body: apibody
        }
    })
    const data = await response;
    let AuthKey = data.result;
    
    // test getting sold listings
    const urlsold = `https://api.rexsoftware.com/v1/rex/listings/search`
    const apibodysold = JSON.stringify({
        criteria: [
            {
              "name": "system_listing_state",
              "type": "=",
              "value": "sold"
            }
          ],
        limit: 50,
        offset: 0,
    })
    const responsesold = EleventyFetch(urlsold, {
        duration: "0s",
        type: "json",
        fetchOptions: {
            method: "post",
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'Authorization': "Bearer "+AuthKey
            },
            body: apibodysold
        }
    })
    const datasold = await responsesold;

    console.log(datasold.result.rows.related)
    // related.listing_images
   
    //okay now I need the await all fetch call or whatever
    // console.log("IDs:", propertyIds)
    let allData = [];
    for(let i = 0; i < datasold.result.rows.length; i++){
            // console.log("Result " + i + ": " + datasold.result.rows[i].system_listing_state, datasold.result.rows[i].property.adr_locality, datasold.result.rows[i].property.id)
            let property = datasold.result.rows[i]
            // console.log(property)
            // console.log(property)
            //need to fetch images also
            let url4 = "https://api.rexsoftware.com/v1/rex/listings/read"
            let apibody4 = JSON.stringify({
                id: property.id,
            })
            // console.log(propertyIds[i])
            let response4 = EleventyFetch(url4, {
                duration: "0s",
                type: "json",
                fetchOptions: {
                    method: "post",
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'Authorization': "Bearer "+AuthKey
                    },
                    body: apibody4
                }
            }).then( data => {
                return data;
            }).catch((error)=>{
                console.log("error",error)
            })
            let fulllisting = await response4;
            allData.push([fulllisting, i])
    }
    console.log("rex sold: ",allData)
    console.log("rex sold0: ",allData[0][0].result)
    let Order = [];
    for(let i = 0; i < allData.length; i++){
        // console.log("rex sold "+ i +": ",allData[i][0].result.system_modtime, allData[i][0].result.property.system_search_key)
        Order.push([allData[i][0].result.system_modtime, i, allData[i][0].result.property.system_search_key]);
    }
    // console.log("Order (pre-sort):", Order)
    Order.sort(function(a,b){if (a[0] < b[0]) return 1; if (a[0] > b[0]) return -1; return 0;})
    // console.log("Order (sorted): ", Order)
    let allDataSorted = [];
    for(let i = 0; i < allData.length; i++){
        allData[Order[i][1]].push(i);
        // console.log("data update"+ i+":", allData[Order[i][1]] );
     allDataSorted.push(allData[Order[i][1]])   
    }
    console.log("allDataSorted: ", allDataSorted)

    // console.log("rex sold0: ",allData[0][0].result.system_modtime, allData[0][0].result.property.system_search_key)
    // console.log("rex sold1: ",allData[1][0].result.system_modtime, allData[1][0].result.property.system_search_key)
    // console.log("rex sold2: ",allData[2][0].result.system_modtime, allData[2][0].result.property.system_search_key)
    // console.log("rex sold3: ",allData[3][0].result.system_modtime, allData[3][0].result.property.system_search_key)
    // console.log("rex sold4: ",allData[4][0].result.system_modtime, allData[4][0].result.property.system_search_key)
    // console.log("rex sold3: ",allData[1][1])

    return allDataSorted;
    // return allData;
}

module.exports = getPropertyData;