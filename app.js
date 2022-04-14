const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());
const events = [];
app.use(
    '/graphql',
    graphqlHTTP({
        schema: buildSchema(`
      type Event {
          _id: ID!
          title: String!
          description: String!
          price: Float!
          date: String
      }

      type User {
          _id: ID!
          email: String!
          password: String
      }

      input EventInput {
        title: String!
          description: String!
          price: Float!
          date: String
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
            events: () => {
                return Event.find()
                    .then((res) => {
                        return res.map((event) => {
                            return { ...event._doc };
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            },
            createEvent: (args) => {
                const eventName = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(args.eventInput.date)
                });
                return eventName
                    .save()
                    .then((result) => {
                        return {
                            ...result._doc,
                            id: result._doc._id.toString()
                        };
                    })
                    .catch((err) => {
                        console.log(err);
                        throw err;
                    });
            },
            createUser: (args) => {
                return User.findOne({ email: args.userInput.email })
                    .then((user) => {
                        if (user) {
                            throw new Error('User exists');
                        }
                        return bcrypt.hash(args.userInput.password, 12);
                    })
                    .then((hachedPassword) => {
                        const userName = new User({
                            email: args.userInput.email,
                            password: hachedPassword
                        });
                        return userName.save();
                    })
                    .then((result) => {
                        return {
                            ...result._doc,
                            password: null,
                            _id: result.id
                        };
                    })
                    .catch((err) => {
                        throw err;
                    });
            }
        },
        graphiql: true
    })
);

mongoose
    .connect(
        `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.zj3jh.mongodb.net/${process.env.MONGODB}?retryWrites=true&w=majority`
    )
    .then(() => {
        app.listen(3000);
    })
    .catch((err) => {
        console.log(err);
    });
