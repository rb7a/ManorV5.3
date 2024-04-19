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
    console.log("rex sold: ",allData[0][0])
    // console.log("rex sold: ",allData[1][1])

    return allData;
    // return allData;
}

module.exports = getPropertyData;