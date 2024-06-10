const { schedule } = require('@netlify/functions')
const fetch = require('node-fetch')


const BUILD_HOOK = "https://api.netlify.com/build_hooks/664d391e0ea5405ea0152137"

// To learn about scheduled functions and supported cron extensions,
// see: https://ntl.fyi/sched-func
module.exports.handler = schedule('0 0 * * *', async (event) => {
  await fetch(BUILD_HOOK, {
    method: 'POST'
  }).then(response => {
    console.log("Build hook response:", response)
  })


  return {
    statusCode: 200,
  }
})
