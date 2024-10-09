require('dotenv').config();
const EleventyFetch = require("@11ty/eleventy-fetch");
const crypto = require('crypto');

async function getPropertyData(){
     //Property vars
     var username = process.env.MANOR_USERNAME;
     var password = process.env.MANOR_PASSWORD;
     var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
     //Tenancy vars
     var api_public_key = process.env.TPS_KEY;
     var api_secret = process.env.TPS_SECRET
     let api_url = "https://www.tpsportal.co.nz/api/v1/tenancy_application/create_property"
     
     function sign(endpoint, key, secret, date, body) {
         const encoded = new
         Buffer([endpoint,body,date].join('\n')).toString('base64');
         return crypto
         .createHash('sha256')
         .update(encoded + '+' + secret, 'utf8')
         .digest()
         .toString('hex');
     }

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
    
    //second step is to get property data
    const url2 = `https://api.rexsoftware.com/v1/rex/published-listings/search`
    const apibody2 = JSON.stringify({
        limit: 100,
        offset: 0
    })
    const response2 = EleventyFetch(url2, {
        duration: "0s",
        type: "json",
        fetchOptions: {
            method: "post",
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'Authorization': "Bearer "+AuthKey
            },
            body: apibody2
        }
    })
    const data2 = await response2;
    let propertyIds =[];
    // console.log("Propertys: ", data2)
    for (let i = 0; i < data2.result.rows.length; i++){
        propertyIds.push(data2.result.rows[i].id)
    }
    //okay now I need the await all fetch call or whatever
    // console.log("IDs:", propertyIds)
    let allData = [];
    let x = 0; 
    for(let i = 0; i < propertyIds.length; i++){
            let url3 = "https://api.rexsoftware.com/v1/rex/listings/read"
            // let url3 = "https://api.rexsoftware.com/v1/rex/published-listings/read"
            let apibody3 = JSON.stringify({
                id: propertyIds[i]
            })
            // console.log(propertyIds[i])
            let response3 = EleventyFetch(url3, {
                duration: "0s",
                type: "json",
                fetchOptions: {
                    method: "post",
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'Authorization': "Bearer "+AuthKey
                    },
                    body: apibody3
                }
            })
            let propertyData = await response3;
            //need to fetch images also
            let url4 = "https://api.rexsoftware.com/v1/rex/properties/get-listing-images"
            let apibody4 = JSON.stringify({
                id: propertyIds[i],
                limit: 20
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
            })
            let imageData = await response4;
            // console.log("rex images: ", imageData)
            
            //Tenancy fetch here too
            // let testapibody = JSON.stringify({
            //     client_code: "8754",
            //     property_code: "RBPR000013",
            //     agent_name: "Adam Brady",
            //     agent_email: "adam@manorrealty.co.nz",
            //     unit: "",
            //     street_number: "43",
            //     street_name: "Cameron Road",
            //     suburb: "Hamilton East",
            //     city: "Hamilton",
            //     postcode: "3210"
            // })
            let d = propertyData.result;
            // console.log("property data set:",d.property.adr_unit_number)
            // console.log("$UNIT",d.property.adr_unit_number)
            // console.log("$STREET NUMBER", d.property.adr_street_number)
            let tenancy_apibody = JSON.stringify({
                client_code: "8754",
                property_code: d.id,
                agent_name: d.system_owner_user.name,
                agent_email: d.system_owner_user.email_address,
                unit: d.property.adr_unit_number,
                street_number: d.property.adr_street_number,
                street_name: d.property.adr_street_name,
                suburb: d.property.adr_suburb_or_town,
                city: d.property.adr_state_or_region,
                postcode: d.property.adr_postcode
            })
            var api_date = new Date().toISOString();
            var signature = sign(api_url,api_public_key,api_secret,api_date,tenancy_apibody) 

            // console.log(signature, api_public_key, api_secret, api_date, tenancy_apibody)
            // console.log("rex")
            // console.log("body sent", tenancy_apibody)
            let tpResponse = await EleventyFetch(api_url, {
                duration: "0s",
                type: "json",
                fetchOptions: {
                    method: 'post', 
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'X-API-DATE': api_date,
                        'X-API-KEY': api_public_key,
                        'X-API-SIGNATURE': signature
                    },
                    body: tenancy_apibody
                }
            }).then( data => {
                // console.log("tpREX:",tenancy_apibody,data)
                return data;
            }).catch((error)=>{
                console.log("error",error)
            })
            // console.log("bye" + i)
            // console.log("Rex tpResponse: ", apibody)
            // console.log(tenancy_apibody)
            let tpData = await tpResponse;
            // console.log("shown here?", imageData)
            // console.log(propertyData.result.system_search_key)
            
            if (propertyData.result.system_listing_state === "current"){
                x = x+1;
                allData.push([propertyData, imageData, tpData, i, x])
            }
    }
    console.log("RexDataLength:",allData.length)
    for(let i = 0; i < allData.length; i++){
        console.log("RexData"+i,", Agent:" + allData[i][0].result.listing_agent_1.name, "Property: "+allData[i][0].result.property.system_search_key)
    }
    
    // console.log("show here pt.2: ", allData[0][1].result)
    // console.log("RexData1:",allData)
    // console.log("RexData1:",allData[0][0].result.related.listing_subcategories)
    // console.log("RexData0:",allData[0][0].result.listing_agent_1)
    // console.log("RexData1:",allData[1][0].result.listing_agent_1)
    // console.log("RexData2:",allData[2][0].result.listing_agent_1)
    // console.log("RexData3:",allData[3][0].result.listing_agent_1)
    // console.log("RexData4:",allData[4][0].result.listing_agent_1)
    // console.log("RexData2:",allData[1][0].result.related.listing_subcategories)
    // console.log("RexData Features:",allData[1][0].result.related.property_features)
    // console.log("RexData Adverts:",allData[1][0].result.related.listing_adverts)

    // console.log("Featured: ", allData.slice(-3))
    // console.log("Rex0:",allData[0][0].result.system_listing_state)
    // console.log("Rex1:",allData[1][0].result.system_listing_state)
    // console.log("Rex2:",allData[2][0].result.system_listing_state)
    // console.log("Rex3:",allData[3][0].result.system_listing_state)
    // console.log("Rex4:",allData[4][0].result.system_listing_state)
    // console.log("Rex5:",allData[5][0].result.system_listing_state)
    // console.log("Rex6:",allData[6][0].result.system_listing_state)
    // console.log("Rex7:",allData[7][0].result.system_listing_state)
    
    // console.log("authkey: ", AuthKey)
    // console.log("tpdata rex",allData[0][2])
    // console.log("tpdata rex",allData[1][2])
    // console.log("tpdata rex",allData[3][2])
    // console.log("Data0",allData[2][0])
    // console.log("ImageData original",allData[0][0].result.related.listing_images)
    // console.log("test", allData[0][0].result.price_advertise_as)
    // console.log("Authkey",AuthKey)
    // console.log(allData[0][0].result.related.listing_images)
    // console.log("test", allData[0][2].redirect)
    // console.log(allData[5][0])
    // console.log(allData[0].result.attr_bedrooms)
    return allData;
}

module.exports = getPropertyData;