const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    popolation: dbObject.population,
  }
}

const convertDistrictObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.distrcit_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStateObject = `
  SELECT
  * FROM
  state
  `
  const movieArray = await db.all(getStateObject)
  response.send(movieArray)
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateDetails = `
  SELECT *
  FROM state
  WHERE state_id = ${stateId}
  `
  const state = await db.get(getStateDetails)
  response.send(state)
})

app.post('/districts/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const addDistrictQuery = `
  INSERT INTO district (state_id,district_name,scases,cured,active,deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  )
  `
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrictDetails = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId}
  `
  const district = await db.get(getDistrictDetails)
  response.send(district)
})

app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM district WHERE district_id = ${districtId}`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId', async (request, reponse) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE district SET 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths} 
  WHERE district_id = ${districtId}`
  await db.run(updateDistrictQuery)
  reponse.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, reponse) => {
  const {stateId} = request.params
  const getDistrictStateQuery = `
  SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths) 
  FROM
  district
  WHERE state_id = ${stateId}`
  const stat = await db.get(getDistrictStateQuery)
  response.send({
    totalCase: stat['SUM(cases)'],
    totalCured: stat['SUM(cured)'],
    totalActive: stat['SUM(active)'],
    totalDeaths: stat['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
  SELECT state_id FROM district
  WHERE district_id = ${districtId}`
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `
  SELECT state_name as stateName FROM state
  WHERE state_id = ${getDistrictIdQueryResponse.state_id}`
  const getStateNameQueryRespnse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryRespnse)
})
module.exports = app
