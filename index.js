import { ApolloServer, UserInputError, gql } from 'apollo-server'
import { v1 as uuid } from 'uuid'
import axios from 'axios'

const persons = [
    {
        name: 'Brahian',
        phone: '123456',
        street: 'Baker Street',
        city: 'London',
        id: '1'
    },
    {
        name: 'Toby',
        phone: '123456',
        street: 'Baker Street',
        city: 'London',
        id: '2'
    },
    {
        name: 'Andrea',
        street: 'Baker Street',
        city: 'London',
        id: '3'
    }
]

const typeDefs = gql`
    enum YesNo {
        YES
        NO
    }

    type Address {
        street: String!
        city: String!
    }

    type Person {
        name: String!
        phone: String
        address: Address!
        id: ID!
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]!
        findPerson(name: String!): Person 
    }

    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
        editNumber(
            name: String!
            phone: String
        ): Person
    }
`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const { data: personsFetch } = await axios('http://localhost:3000/persons')
            if (!args.phone) return personsFetch

            const byPhone = person =>
                args.phone === 'YES' ? person.phone : !person.phone

            return personsFetch.filter(byPhone)
        },
        findPerson: (root, args) => {
            const { name } = args
            return persons.find(person => person.name === name)
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(person => person.name === args.name)) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.name
                })
            }

            const person = { ...args, id: uuid() }
            persons.push(person)

            return person
        },
        editNumber: (root, args) => {
            const personIndex = persons.findIndex(person => person.name === args.name)

            if (personIndex === -1) return null

            const person = persons[personIndex]

            const updatedPerson = { ...person, phone: args.phone }
            persons[personIndex] = updatedPerson

            return updatedPerson
        }
    },
    Person: {
        address: (root) => {
            return {
                street: root.street,
                city: root.city
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})