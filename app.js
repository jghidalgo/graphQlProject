const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event');

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

      input EventInput {
        title: String!
          description: String!
          price: Float!
          date: String
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
