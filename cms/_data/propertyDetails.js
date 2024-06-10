require('dotenv').config();
const EleventyFetch = require("@11ty/eleventy-fetch");
const crypto = require('crypto');

async function getPropertyData(){
    // console.log("getPropertyData...")
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
    
   

    //Get Property Details
    const url = `https://api.getpalace.com/Service.svc/RestService/v2AvailableProperties/JSON`
    const response = EleventyFetch(url, {
        duration: "0s",
        type: "json",
        fetchOptions: {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'Authorization': auth
            }
        }
    })
    const properties = await response;

    // const leasedurl = `https://manor-realty.boxdice.com.au/website_api/rental_listings`
    // const leasedresponse = EleventyFetch(leasedurl, {
    //     duration: "0s",
    //     type: "json",
    //     fetchOptions: {
    //         headers: {
    //             accept: 'application/json',
    //             'content-type': 'application/json',
    //             'Authorization': 'Api-Key token=02f27a0c5038655160d4d4831b3232d6e400fbd3'
    //         }
    //     }
    // })
    // const leasedproperties = await leasedresponse;

    // console.log("Leased Properties: ", leasedproperties)


    //Create URLs for Image call
    let propertyImageUrls = []
    properties.forEach(property => {
        propertyImageUrls.push(`https://api.getpalace.com/Service.svc/RestService/v2AvailablePropertyImagesURL/JSON/${property.PropertyCode}`)
    });
    


    let allData = [];
    let order = 0;
    //Fetch Property Images
    const allPropertyImages = await Promise.all(propertyImageUrls.map(async (url,i) => {
        const imageResponse = await EleventyFetch(url, {
            duration: "0s",
            type: "json",
            fetchOptions: {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'Authorization': auth
                }
            }
        });
        let tpData;
        const imageData = await imageResponse;
        //Add property matching details + image to allData array
        // console.log(imageData)
        let testapibody = JSON.stringify({
            client_code: "8754",
            property_code: "RBPR000013",
            agent_name: "Adam Brady",
            agent_email: "adam@manorrealty.co.nz",
            unit: "",
            street_number: "43",
            street_name: "Cameron Road",
            suburb: "Hamilton East",
            city: "Hamilton",
            postcode: "3210"
        })
        let apibody = JSON.stringify({
            client_code: "8754",
            property_code: properties[i].PropertyCode,
            agent_name: properties[i].PropertyAgent.PropertyAgentFullName,
            agent_email: properties[i].PropertyAgent.PropertyAgentEmail1,
            unit: properties[i].PropertyUnit,
            street_number: properties[i].PropertyAddress1,
            street_name: properties[i].PropertyAddress2,
            suburb: properties[i].PropertyAddress3,
            city: properties[i].PropertyAddress4,
            postcode: properties[i].PropertyFeatures.PropertyPostCode
        })
        // console.log("API BODY " + i +" :",apibody)
        var api_date = new Date().toISOString();
        var signature = sign(api_url,api_public_key,api_secret,api_date,apibody) 
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
                body: apibody
            }
        }).then( data => {
            
            return data;
        }).catch((error) => {
            console.log("error", error)
        })
        tpData = await tpResponse;
        // console.log("tp:",apibody,tpData)
        order = order + 1;
        allData.push([properties[i], imageData, tpData, i, order])
    }))

   
    
    // console.log("OUTPUT:", allData[0][4])
    // console.log("OUTPUT:", allData[1][4])
    // console.log("OUTPUT:", allData[2][4])
    // console.log("OUTPUT:", allData[3][4])
    // console.log("OUTPUT:", allData[4][4])
    // console.log("OUTPUT:", allData[1][2])
    // console.log("OUTPUT:", allData[2][2])
    // console.log("OUTPUT:", allData[3][2])
    // console.log("tpdata",allData[0][2])
  
    console.log("Palace2: ", allData)
      console.log("Palace: ", allData.length)
    // console.log(allData[0][0].PropertyAddress1)
    // console.log("rent test:", allData[0][0].PropertyRentAmount," period test:", allData[0][0].PropertyRentalPeriod,"beds test:", allData[0][0].PropertyFeatures.PropertyBedroomsNo,"bath test:", allData[0][0].PropertyFeatures.PropertyBathroomsNo,"car test:", allData[0][0].PropertyFeatures.PropertyCarsNo )
    // console.log("image", allData[0][1][0])


    return allData;
}

module.exports = getPropertyData;













// let testapi_body = JSON.stringify({
//     client_code:"5866",
//     property_code: "ABC123",
//     agent_name: "Bob Testing",
//     agent_email: "bob@testing.com",
//     unit: "1",
//     street_number: 123,
//     street_name: "Testing Avenue",
//     suburb: "Testingburb",
//     city: "Testingville",
//     postcode: "1234"
// })
// //Since I'm using properties[i] here I have the data to make the Tenancy call here and add to allData
// let api_body = JSON.stringify({
//     client_code: "8754",
//     property_code: properties[6].PropertyCode,
//     agent_name: properties[6].PropertyAgent.PropertyAgentFullName,
//     agent_email: properties[6].PropertyAgent.PropertyAgentEmail1,
//     unit: properties[6].PropertyUnit,
//     street_number: properties[6].PropertyAddress1,
//     street_name: properties[6].PropertyAddress2,
//     suburb: properties[6].PropertyAddress3,
//     city: properties[6].PropertyAddress4,
//     postcode: properties[6].PropertyPostCode
// })
// let testapibody = JSON.stringify({
//     client_code: "8754",
//     property_code: "RBPR000027",
//     agent_name: properties[i].PropertyAgent.PropertyAgentFullName,
//     agent_email: properties[i].PropertyAgent.PropertyAgentEmail1,
//     unit: "",
//     street_number: "19",
//     street_name: "Ravencourt Place",
//     suburb: "Huntington",
//     city: "Hamilton",
//     postcode: "3210"
// })
// let testapibody2 = JSON.stringify({
//     client_code: "8754",
//     property_code: "RBPR000011",
//     agent_name: properties[i].PropertyAgent.PropertyAgentFullName,
//     agent_email: properties[i].PropertyAgent.PropertyAgentEmail1,
//     unit: "",
//     street_number: "2/6B",
//     street_name: "Sunnyside Road",
//     suburb: "Nawton",
//     city: "Hamilton",
//     postcode: "3200"
// })