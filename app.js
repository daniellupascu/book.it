const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const { buildSchema } = require('graphql')
const mongoose = require('mongoose')

const Event = require('./models/event')

let app = express()

app.use(bodyParser.json())

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () =>  {
            return Event.find().then(events => {
                return events.map(event => {
                    return { ...event._doc, _id: event.id }
                })
            }).catch(e => {
                throw e
            }) 
        },
        createEvent: args => {
            // const event = {
            //     _id: Math.random().toString(),
            //     title: args.eventInput.title,
            //     description: args.eventInput.description,
            //     price: +args.eventInput.price,
            //     date: args.eventInput.date,
            // }
            // events.push(event)
            // return event

            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
            })

            return event.save().then(result => ({...result._doc, _id: event.id})).catch(e => {
                console.log(e)
                throw e
            })

        }
    }, 
    graphiql: true
})) 

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@bookit-a1klz.mongodb.net/test?retryWrites=true`, {useNewUrlParser: true}).then(() => {
    app.listen(3000, () => {
        console.log('running on port 3000')
    })    
}).catch(e => console.log(e))
