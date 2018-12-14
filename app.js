const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const { buildSchema } = require('graphql')


let app = express()

app.use(bodyParser.json())

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type RootQuery {
            events: [String!]!
        }

        type RootMutation {
            createEvent(name: String): String
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () =>  ['coding', 'dreaming'],
        createEvent: args => `Event created ${args.name}`
    },
    graphiql: true
})) 

app.listen(3000, () => {
    console.log('running on port 3000')
})