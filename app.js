const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const { buildSchema } = require('graphql')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Event = require('./models/event')
const User = require('./models/user')

let app = express()

app.use(bodyParser.json())

// fix for the issue https://github.com/apollographql/apollo-server/issues/1633
mongoose.Types.ObjectId.prototype.valueOf = function () {
	return this.toString();
};


app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String! 
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User 
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
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '5c311dec68c8fb50876d7e79',
            })

            let createdEvent;
            
            return event.save()
            .then(result => {
                createdEvent = result
                return User.findById('5c311dec68c8fb50876d7e79')
            })
            .then(user => {
                if(!user) throw new Error('User does not exists')
                user.createdEvents.push(event)
                return user.save()
            })
            .then(result => {
                return createdEvent
            })
            .catch(e => {
                console.log(e)
                throw e
            })

        },
        createUser: args => {
            return User.findOne({email: args.userInput.email})
            .then(user => {
                if(user) throw new Error('User already exists')
                return bcrypt.hash(args.userInput.password, 12)
            })
            .then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword,
                })

                return user.save()
            })
            .then(result => ({...result._doc, _id: result.id, password: null}))
            .catch(e => {
                throw e
            })
        },
    }, 
    graphiql: true
})) 

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@bookit-a1klz.mongodb.net/test?retryWrites=true`, {useNewUrlParser: true}).then(() => {
    app.listen(3000, () => {
        console.log('running on port 3000')
    })    
}).catch(e => console.log(e))
